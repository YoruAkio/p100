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

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  frame,
  rollingCode,
  onNavigate,
  scanlines,
  glow,
  convex,
}) => {
  // render individual teletext row with normal 40-character span flow
  const renderRow = (rowSpans: TeletextSpan[], rowIndex: number) => {
    const charCount = rowSpans.reduce((sum, s) => sum + s.t.length, 0);
    const padding = charCount < 40 ? ' '.repeat(40 - charCount) : '';

    return (
      <div key={rowIndex} className="tt-row">
        {rowSpans.map((span, spanIdx) => {
          const fgClass = `fg-${span.c || 'white'}`;
          const bgClass = `bg-${span.b || 'black'}`;
          const dClass = span.d ? 'double' : '';
          return (
            <span
              key={spanIdx}
              className={`tt-span ${fgClass} ${bgClass} ${dClass}`}
            >
              {span.t}
            </span>
          );
        })}
        {padding && (
          <span className="tt-span fg-white bg-black">{padding}</span>
        )}
      </div>
    );
  };

  // build header row when rolling page hunt is active or regular
  const renderHeader = () => {
    const firstRow = frame.rows[0] || [];
    if (!rollingCode) {
      return renderRow(firstRow, 0);
    }

    const displayPage = `P${rollingCode.padEnd(4, ' ')}`;
    return (
      <div key={0} className="tt-row">
        <span className="tt-span fg-yellow bg-blue double">{displayPage}</span>
        <span className="tt-span fg-white bg-blue">
          {' P100 TUNING BROADCAST... '.padEnd(27, ' ')}
        </span>
        <span className="tt-span fg-yellow bg-blue">{'SEARCH  '}</span>
      </div>
    );
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
