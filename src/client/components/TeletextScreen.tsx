// authentic 1980s color crt television set component

import React from 'react';
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

interface TeletextCell {
  char: string;
  fg: string;
  bg: string;
  double?: boolean;
}

// unpack compressed teletext spans into an exact 40-character grid row
function expandRowToCells(rowSpans: TeletextSpan[]): TeletextCell[] {
  const cells: TeletextCell[] = [];
  for (const span of rowSpans) {
    const chars = Array.from(span.t);
    for (const ch of chars) {
      if (cells.length >= 40) break;
      cells.push({
        char: ch,
        fg: `fg-${span.c || 'white'}`,
        bg: `bg-${span.b || 'black'}`,
        double: span.d,
      });
    }
    if (cells.length >= 40) break;
  }
  while (cells.length < 40) {
    cells.push({
      char: ' ',
      fg: 'fg-white',
      bg: 'bg-black',
    });
  }
  return cells;
}

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  frame,
  rollingCode,
  onNavigate,
  scanlines,
  glow,
  convex,
}) => {
  // render individual teletext row with 40 equal-width columns
  const renderRow = (rowSpans: TeletextSpan[], rowIndex: number) => {
    const cells = expandRowToCells(rowSpans);

    return (
      <div key={rowIndex} className="tt-row">
        {cells.map((cell, cellIdx) => (
          <span
            key={cellIdx}
            className={`tt-cell ${cell.fg} ${cell.bg} ${cell.double ? 'double' : ''}`}
          >
            {cell.char}
          </span>
        ))}
      </div>
    );
  };

  // build header row when rolling page hunt is active or regular
  const renderHeader = () => {
    if (!rollingCode) {
      return renderRow(frame.rows[0] || [], 0);
    }

    const displayPage = `P${rollingCode.padEnd(4, ' ')}`;
    const tuningText = ' P100 TUNING BROADCAST... '.padEnd(27, ' ');
    const searchTag = 'SEARCH  ';

    const headerSpans: TeletextSpan[] = [
      { t: displayPage, c: 'yellow', b: 'blue', d: true },
      { t: tuningText, c: 'white', b: 'blue' },
      { t: searchTag, c: 'yellow', b: 'blue' },
    ];

    return renderRow(headerSpans, 0);
  };

  return (
    <div className="crt-tv-chassis">
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

              {/* 40x24 teletext grid spanning full screen width */}
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
