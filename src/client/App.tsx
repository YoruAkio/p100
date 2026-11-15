// main client application component

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { generatePage404 } from '../teletext/page404';
import { TeletextFrameResponse } from '../teletext/types';
import { getIndexPage } from '../server/services/indexPage';
import { getBulletinPage } from '../server/services/bulletin';
import { getEarthquakePage } from '../server/services/earthquake';
import { getWeatherPage } from '../server/services/weather';
import { getTransitPage } from '../server/services/transit';
import { getEmergencyPage } from '../server/services/emergency';
import { getDiagnosticsPage } from '../server/services/diagnostics';
import { playDegauss, playKeyClick, playPacketChirp, playRollChirp } from './audio';
import { TeletextHUD } from './components/TeletextHUD';
import { TeletextRemote } from './components/TeletextRemote';
import { TeletextScreen } from './components/TeletextScreen';

// local deterministic page resolver for offline, preview, and zero-fail resilience
export async function resolvePageLocal(
  code: string,
  sub: number,
): Promise<TeletextFrameResponse> {
  switch (code) {
    case '100':
      return getIndexPage();
    case '102':
      return getBulletinPage();
    case '201':
      if (sub === 2) {
        return await getWeatherPage();
      }
      return await getEarthquakePage();
    case '301':
      return getTransitPage();
    case '401':
      return getEmergencyPage();
    case '999':
      return getDiagnosticsPage();
    default:
      return generatePage404(code);
  }
}

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
  const [convex, setConvex] = useState<boolean>(true);
  const [irBlink, setIrBlink] = useState<boolean>(false);
  const [audio, setAudio] = useState<boolean>(true);
  const [hold, setHold] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const rollTimerRef = useRef<number | null>(null);
  const irTimerRef = useRef<number | null>(null);

  // flash infrared transmitter on remote
  const triggerIrFlash = useCallback(() => {
    setIrBlink(true);
    if (irTimerRef.current) clearTimeout(irTimerRef.current);
    irTimerRef.current = window.setTimeout(() => {
      setIrBlink(false);
    }, 150);
  }, []);

  // fetch page from edge api with instant local fallback
  const fetchPage = useCallback(
    async (code: string, sub: number) => {
      triggerIrFlash();
      playRollChirp(audio);
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

        let data: TeletextFrameResponse | null = null;
        try {
          const res = await fetch(`/api/page/${code}?subpage=${sub}`);
          if (res.ok) {
            data = (await res.json()) as TeletextFrameResponse;
          }
        } catch {
          // edge api unavailable or offline, use deterministic local fallback
        }

        if (!data) {
          data = await resolvePageLocal(code, sub);
        }

        const elapsed = Math.round(performance.now() - startTime);
        setLatencyMs(elapsed);

        if (rollTimerRef.current) {
          clearInterval(rollTimerRef.current);
          rollTimerRef.current = null;
        }
        setRollingCode(null);

        setFrame(data);
        setCurrentPage(code);
        setSubpage(data.subpage);
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
    [audio, slow2G, triggerIrFlash],
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
      triggerIrFlash();
      playKeyClick(audio);
      const next = `${inputBuffer}${digit}`;
      if (next.length === 3) {
        setInputBuffer('');
        navigateTo(next);
      } else {
        setInputBuffer(next);
      }
    },
    [audio, inputBuffer, navigateTo, triggerIrFlash],
  );

  // handle subpage change
  const handleSubpageChange = useCallback(
    (direction: 'prev' | 'next') => {
      triggerIrFlash();
      playKeyClick(audio);
      if (frame.totalSubpages <= 1) return;
      let nextSub = subpage;
      if (direction === 'prev') {
        nextSub = subpage > 1 ? subpage - 1 : frame.totalSubpages;
      } else {
        nextSub = subpage < frame.totalSubpages ? subpage + 1 : 1;
      }
      fetchPage(currentPage, nextSub);
    },
    [audio, currentPage, fetchPage, frame.totalSubpages, subpage, triggerIrFlash],
  );

  // toggle subpage auto-roll / hold
  const handleToggleHold = useCallback(() => {
    triggerIrFlash();
    playKeyClick(audio);
    setHold((prev) => !prev);
  }, [audio, triggerIrFlash]);

  // export active frame as raw 40x24 ascii packet for lora/ham radio/sms
  const handleCopyPacket = useCallback(() => {
    triggerIrFlash();
    playPacketChirp(audio);
    const packet = frame.rows
      .map((row) =>
        row
          .map((s) => s.t)
          .join('')
          .padEnd(40, ' '),
      )
      .join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(packet).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [audio, frame.rows, triggerIrFlash]);

  // auto-roll subpages every 10 seconds unless HOLD is active
  useEffect(() => {
    if (hold || frame.totalSubpages <= 1) return;
    const timer = window.setInterval(() => {
      const nextSub = subpage < frame.totalSubpages ? subpage + 1 : 1;
      fetchPage(currentPage, nextSub);
    }, 10000);
    return () => clearInterval(timer);
  }, [currentPage, fetchPage, frame.totalSubpages, hold, subpage]);

  // listen to global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key === ' ' || key === 'O') {
        e.preventDefault();
        handleToggleHold();
      } else if (key === 'X' || key === 'P') {
        e.preventDefault();
        handleCopyPacket();
      } else if (e.key === 'Escape' || key === 'H') {
        e.preventDefault();
        navigateTo('100');
      } else if (e.key === 'Backspace') {
        triggerIrFlash();
        playKeyClick(audio);
        setInputBuffer((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    audio,
    frame.fastext,
    handleCopyPacket,
    handleDigit,
    handleSubpageChange,
    handleToggleHold,
    navigateTo,
    triggerIrFlash,
  ]);

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
        convex={convex}
        onToggleConvex={(val) => {
          playDegauss(audio);
          setConvex(val);
        }}
        audio={audio}
        onToggleAudio={setAudio}
        hold={hold}
        copied={copied}
      />

      <div className="teletext-main-layout">
        <TeletextScreen
          frame={frame}
          rollingCode={rollingCode}
          onNavigate={navigateTo}
          scanlines={scanlines}
          glow={glow}
          convex={convex}
        />

        <div className="remote-column">
          <TeletextRemote
            inputBuffer={inputBuffer}
            currentPage={currentPage}
            subpage={subpage}
            totalSubpages={frame.totalSubpages}
            fastext={frame.fastext}
            hold={hold}
            onToggleHold={handleToggleHold}
            onCopyFrame={handleCopyPacket}
            copied={copied}
            onDigitPress={handleDigit}
            onClear={() => {
              triggerIrFlash();
              playKeyClick(audio);
              setInputBuffer('');
            }}
            onSubpageChange={handleSubpageChange}
            onNavigate={navigateTo}
            irBlink={irBlink}
          />
        </div>
      </div>

      <footer className="p100-guide">
        <p>
          Hardware Controls: <kbd>0-9</kbd> Jump Page | <kbd>R</kbd> Red | <kbd>G</kbd> Green | <kbd>Y</kbd> Yellow | <kbd>C</kbd> Cyan | <kbd>&larr;/&rarr;</kbd> Subpage | <kbd>Space</kbd> Hold/Roll | <kbd>X</kbd> Copy Packet | <kbd>Esc</kbd> Index P100
        </p>
        <p style={{ marginTop: '0.4rem', color: '#4a5568' }}>
          Kiroween 2026 Hackathon &bull; Resurrection Category &bull; 1980s CRT Teletext Broadcast Terminal
        </p>
      </footer>
    </div>
  );
};
