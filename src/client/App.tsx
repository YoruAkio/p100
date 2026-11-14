// main client application component

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generatePage404 } from '../teletext/page404';
import { TeletextFrameResponse } from '../teletext/types';
import { getIndexPage } from '../server/services/indexPage';
import { TeletextHUD } from './components/TeletextHUD';
import { TeletextRemote } from './components/TeletextRemote';
import { TeletextScreen } from './components/TeletextScreen';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('100');
  const [subpage, setSubpage] = useState<number>(1);
  const [frame, setFrame] = useState<TeletextFrameResponse>(() => getIndexPage());
  const [inputBuffer, setInputBuffer] = useState<string>('');
  const [rollingCode, setRollingCode] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(8);
  const [slow2G, setSlow2G] = useState<boolean>(false);
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [glow, setGlow] = useState<boolean>(true);

  const rollTimerRef = useRef<number | null>(null);

  // fetch page from edge api
  const fetchPage = useCallback(
    async (code: string, sub: number) => {
      const startTime = performance.now();

      // trigger teletext header roll animation
      let step = 0;
      const targetNum = parseInt(code, 10) || 100;
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);

      rollTimerRef.current = window.setInterval(() => {
        step++;
        const simulatedPage = String(100 + ((targetNum + step * 13) % 900));
        setRollingCode(simulatedPage);
      }, 50);

      try {
        if (slow2G) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }

        const res = await fetch(`/api/page/${code}?subpage=${sub}`);
        const elapsed = Math.round(performance.now() - startTime);
        setLatencyMs(elapsed);

        if (rollTimerRef.current) {
          clearInterval(rollTimerRef.current);
          rollTimerRef.current = null;
        }
        setRollingCode(null);

        if (res.ok) {
          const data = (await res.json()) as TeletextFrameResponse;
          setFrame(data);
          setCurrentPage(code);
          setSubpage(data.subpage);
        } else {
          const errData = (await res.json()) as TeletextFrameResponse;
          setFrame(errData);
          setCurrentPage(code);
          setSubpage(1);
        }
      } catch {
        if (rollTimerRef.current) {
          clearInterval(rollTimerRef.current);
          rollTimerRef.current = null;
        }
        setRollingCode(null);
        setFrame(generatePage404(code));
        setCurrentPage(code);
        setSubpage(1);
      }
    },
    [slow2G],
  );

  // navigate to a specific page
  const navigateTo = useCallback(
    (code: string) => {
      setInputBuffer('');
      fetchPage(code, 1);
    },
    [fetchPage],
  );

  // handle digit keypad input
  const handleDigit = useCallback(
    (digit: string) => {
      const next = `${inputBuffer}${digit}`;
      if (next.length === 3) {
        setInputBuffer('');
        navigateTo(next);
      } else {
        setInputBuffer(next);
      }
    },
    [inputBuffer, navigateTo],
  );

  // handle subpage change
  const handleSubpageChange = useCallback(
    (direction: 'prev' | 'next') => {
      if (frame.totalSubpages <= 1) return;
      let nextSub = subpage;
      if (direction === 'prev') {
        nextSub = subpage > 1 ? subpage - 1 : frame.totalSubpages;
      } else {
        nextSub = subpage < frame.totalSubpages ? subpage + 1 : 1;
      }
      fetchPage(currentPage, nextSub);
    },
    [currentPage, fetchPage, frame.totalSubpages, subpage],
  );

  // listen to global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ignore if typing in form inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // numeric digits 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
        return;
      }

      // fastext keyboard shortcuts
      const key = e.key.toUpperCase();
      if (key === 'R') {
        e.preventDefault();
        navigateTo(frame.fastext.red.code);
      } else if (key === 'G') {
        e.preventDefault();
        navigateTo(frame.fastext.green.code);
      } else if (key === 'Y') {
        e.preventDefault();
        navigateTo(frame.fastext.yellow.code);
      } else if (key === 'C') {
        e.preventDefault();
        navigateTo(frame.fastext.cyan.code);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSubpageChange('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSubpageChange('next');
      } else if (e.key === 'Escape' || key === 'H') {
        e.preventDefault();
        navigateTo('100');
      } else if (e.key === 'Backspace') {
        setInputBuffer((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frame.fastext, handleDigit, handleSubpageChange, navigateTo]);

  return (
    <div className="p100-app">
      <TeletextHUD
        bytes={frame.bytes || 1200}
        latencyMs={latencyMs}
        source={frame.source}
        slow2G={slow2G}
        onToggleSlow2G={setSlow2G}
        scanlines={scanlines}
        onToggleScanlines={setScanlines}
        glow={glow}
        onToggleGlow={setGlow}
      />

      <main className="teletext-workspace">
        <TeletextScreen
          frame={frame}
          rollingCode={rollingCode}
          onNavigate={navigateTo}
          scanlines={scanlines}
          glow={glow}
        />

        <TeletextRemote
          inputBuffer={inputBuffer}
          currentPage={currentPage}
          subpage={subpage}
          totalSubpages={frame.totalSubpages}
          fastext={frame.fastext}
          onDigitPress={handleDigit}
          onClear={() => setInputBuffer('')}
          onSubpageChange={handleSubpageChange}
          onNavigate={navigateTo}
        />
      </main>

      <footer className="p100-guide">
        <p>
          Keyboard Controls: <kbd>0-9</kbd> Jump Page | <kbd>R</kbd> Red | <kbd>G</kbd> Green | <kbd>Y</kbd> Yellow | <kbd>C</kbd> Cyan | <kbd>&larr;/&rarr;</kbd> Subpage | <kbd>Esc</kbd> Index P100
        </p>
        <p style={{ marginTop: '0.4rem', color: '#4a5568' }}>
          Kiroween 2026 Hackathon &bull; Resurrection Category &bull; Sub-2KB Edge Broadcast
        </p>
      </footer>
    </div>
  );
};
