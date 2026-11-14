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
  onChannelKnobClick: () => void;
}

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  frame,
  rollingCode,
  onNavigate,
  scanlines,
  glow,
  convex,
  onChannelKnobClick,
}) => {
  // render individual teletext row
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

  // build header row when rolling page hunt is active
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

      {/* top ventilation slats */}
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

              {/* 40x24 teletext grid */}
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

          <div className="bezel-bottom-label">
            <span className="model-badge">P100 COLOR MONITOR</span>
            <span className="carrier-badge">4.5MHz WST DECODER</span>
          </div>
        </div>

        {/* television right-hand tactile control panel */}
        <aside className="tv-control-panel">
          {/* brand plate */}
          <div className="tv-brand-plate">
            <div className="brand-logo">KIRO</div>
            <div className="brand-sub">CRISIS TV-84</div>
          </div>

          {/* rotary channel selector dial */}
          <div className="tv-knob-group">
            <span className="tv-knob-title">CHANNEL</span>
            <button
              className="tv-rotary-dial"
              onClick={onChannelKnobClick}
              title="Click to Click Through Channels (P100 -> P201 -> P301 -> P401 -> P999)"
            >
              <div className="rotary-notch" />
              <div className="dial-numbers">
                <span className="d-100">1</span>
                <span className="d-201">2</span>
                <span className="d-301">3</span>
                <span className="d-401">4</span>
                <span className="d-999">9</span>
              </div>
            </button>
          </div>

          {/* volume & tuning analog pots */}
          <div className="tv-knob-row">
            <div className="tv-small-knob">
              <span className="tv-sub-title">VOL</span>
              <div className="small-dial" />
            </div>
            <div className="tv-small-knob">
              <span className="tv-sub-title">TUNE</span>
              <div className="small-dial tuned" />
            </div>
          </div>

          {/* power switch and pilot lamp */}
          <div className="tv-power-section">
            <div className="tv-pilot-lamp on" title="Power / Receiver Carrier Locked">
              <span className="lamp-bulb" />
            </div>
            <span className="tv-power-label">POWER</span>
          </div>

          {/* acoustic speaker grille */}
          <div className="tv-speaker-grille">
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
            <span className="speaker-slot" />
          </div>
        </aside>
      </div>
    </div>
  );
};
