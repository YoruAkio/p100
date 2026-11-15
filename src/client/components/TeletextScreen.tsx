// authentic 1980s color crt television set component

import React, { useEffect, useState } from 'react';
import { TeletextFrameResponse, TeletextSpan } from '../../teletext/types';
import { TeletextFastext } from './TeletextFastext';

interface TeletextScreenProps {
  frame: TeletextFrameResponse;
  rollingCode: string | null;
  onNavigate: (code: string) => void;
  scanlines: boolean;
  glow: boolean;
  convex: boolean;
}

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  frame,
  rollingCode,
  onNavigate,
  scanlines,
  glow,
  convex,
}) => {
  const [liveClock, setLiveClock] = useState<string>(() =>
    new Date().toTimeString().slice(0, 8),
  );

  // keep broadcast header clock live every second
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveClock(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // render individual teletext row mapped to full-width 40-column matrix
  const renderRow = (rowSpans: TeletextSpan[], rowIndex: number) => {
    // decompose row spans into exactly 40 character cells to guarantee full-width raster
    const cells: { char: string; fg: string; bg: string; double: boolean }[] = [];
    for (const span of rowSpans) {
      const fg = span.c || 'white';
      const bg = span.b || 'black';
      const double = Boolean(span.d);
      for (const ch of span.t) {
        if (cells.length < 40) {
          cells.push({ char: ch, fg, bg, double });
        }
      }
    }
    while (cells.length < 40) {
      cells.push({ char: ' ', fg: 'white', bg: 'black', double: false });
    }

    return (
      <div key={rowIndex} className="tt-row">
        {cells.map((cell, cellIdx) => (
          <span
            key={cellIdx}
            className={`tt-cell fg-${cell.fg} bg-${cell.bg} ${
              cell.double ? 'double' : ''
            }`}
          >
            {cell.char}
          </span>
        ))}
      </div>
    );
  };

  // build header row when rolling page hunt is active or regular
  const renderHeader = () => {
    const firstRow = frame.rows[0] || [];
    if (!rollingCode) {
      // replace static header time with real-time broadcast clock
      const liveRow = firstRow.map((span, idx) => {
        if (idx === firstRow.length - 1 && span.t.length >= 8) {
          return { ...span, t: liveClock };
        }
        return span;
      });
      return renderRow(liveRow, 0);
    }

    const displayPage = `P${rollingCode.padEnd(4, ' ')}`;
    return renderRow(
      [
        { t: displayPage, c: 'yellow', b: 'blue', d: true },
        { t: ' P100 TUNING BROADCAST... '.padEnd(27, ' '), c: 'white', b: 'blue' },
        { t: 'SEARCH  ', c: 'yellow', b: 'blue' },
      ],
      0,
    );
  };

  // accessible summary for screen readers
  const plainTextSummary = frame.rows
    .map((r) => r.map((s) => s.t).join(''))
    .filter((line) => line.trim().length > 0)
    .join(' ');

  return (
    <div className="crt-tv-chassis">
      {/* accessible screen reader broadcast announcement */}
      <div className="sr-only" aria-live="polite">
        P100 Teletext Page {frame.code}, Subpage {frame.subpage} of {frame.totalSubpages}: {frame.title}. {plainTextSummary}
      </div>

      {/* top rabbit-ear antenna silhouette */}
      <div className="tv-antenna-left" aria-hidden="true" />
      <div className="tv-antenna-right" aria-hidden="true" />

      {/* top heat ventilation slats */}
      <div className="tv-top-ventilation">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="tv-main-front">
        {/* deeply recessed crt screen housing */}
        <div className="crt-screen-bezel">
          <div className="crt-screen-trim">
            {/* convex glass tube container */}
            <div className={`crt-glass-tube ${convex ? 'convex-active' : 'flat-active'}`}>
              {/* optical layers */}
              {scanlines && <div className="crt-scanlines" />}
              <div className="crt-phosphor-mask" />
              {convex && <div className="crt-glass-glare" />}
              <div className="crt-vignette" />

              {/* 40x24 teletext grid in standard 40ch native viewport */}
              <div
                className={`teletext-grid ${glow ? 'crt-glow' : ''} ${
                  convex ? 'grid-curved' : ''
                }`}
              >
                {renderHeader()}
                {frame.rows.slice(1, 23).map((row, idx) => renderRow(row, idx + 1))}
                <TeletextFastext
                  fastext={frame.fastext}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </div>

          {/* authentic television bottom bezel branding & pilot led */}
          <div className="bezel-bottom-label">
            <div className="bezel-left">
              <span className="bezel-power-led" title="Power Carrier Locked" />
              <span className="model-badge">KIRO CRISIS TV-84</span>
            </div>
            <div className="bezel-right">
              <span className="carrier-badge">P100 COLOR MONITOR &bull; 4.5MHz WST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
