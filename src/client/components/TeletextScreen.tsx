// 40x24 teletext terminal screen component

import React from 'react';
import { TeletextFrameResponse, TeletextSpan } from '../../teletext/types';
import { TeletextFastext } from './TeletextFastext';

interface TeletextScreenProps {
  frame: TeletextFrameResponse;
  rollingCode: string | null;
  onNavigate: (code: string) => void;
  scanlines: boolean;
  glow: boolean;
}

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  frame,
  rollingCode,
  onNavigate,
  scanlines,
  glow,
}) => {
  // render individual row
  const renderRow = (rowSpans: TeletextSpan[], rowIndex: number) => {
    // calculate total characters in this row to pad up to 40
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

    // replace page tag with rolling code
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
    <div className="crt-bezel">
      <div className="bezel-brand">
        <span>TELETEXT MODEL-1982 WST</span>
        <span className="bezel-led" title="Broadcast Carrier Online" />
      </div>

      <div className="crt-screen-container">
        {scanlines && <div className="crt-scanlines" />}
        <div className={`teletext-grid ${glow ? 'crt-glow' : ''}`}>
          {renderHeader()}
          {frame.rows.slice(1, 23).map((row, idx) => renderRow(row, idx + 1))}
          <TeletextFastext
            fastext={frame.fastext}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
};
