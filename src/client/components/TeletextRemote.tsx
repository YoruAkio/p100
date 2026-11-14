// tactile retro tv remote control numpad component

import React from 'react';
import { FastextNav } from '../../teletext/types';

interface TeletextRemoteProps {
  inputBuffer: string;
  currentPage: string;
  subpage: number;
  totalSubpages: number;
  fastext: FastextNav;
  onDigitPress: (digit: string) => void;
  onClear: () => void;
  onSubpageChange: (direction: 'prev' | 'next') => void;
  onNavigate: (code: string) => void;
}

export const TeletextRemote: React.FC<TeletextRemoteProps> = ({
  inputBuffer,
  currentPage,
  subpage,
  totalSubpages,
  fastext,
  onDigitPress,
  onClear,
  onSubpageChange,
  onNavigate,
}) => {
  // format 3-digit buffer display
  const displayBuffer = inputBuffer
    ? `P${inputBuffer.padEnd(3, '_')}`
    : `P${currentPage}`;

  return (
    <aside className="remote-chassis">
      <div className="remote-header">REMOTE CONTROLLER</div>

      {/* page code digital display */}
      <div className="remote-input-display">{displayBuffer}</div>

      {/* fastext color buttons */}
      <div className="remote-fastext-grid">
        <button
          className="remote-btn btn-red"
          onClick={() => onNavigate(fastext.red.code)}
          title={`Jump to P${fastext.red.code}`}
        >
          RED
        </button>
        <button
          className="remote-btn btn-green"
          onClick={() => onNavigate(fastext.green.code)}
          title={`Jump to P${fastext.green.code}`}
        >
          GREEN
        </button>
        <button
          className="remote-btn btn-yellow"
          onClick={() => onNavigate(fastext.yellow.code)}
          title={`Jump to P${fastext.yellow.code}`}
        >
          YELLOW
        </button>
        <button
          className="remote-btn btn-cyan"
          onClick={() => onNavigate(fastext.cyan.code)}
          title={`Jump to P${fastext.cyan.code}`}
        >
          CYAN
        </button>
      </div>

      {/* subpage navigation */}
      <div className="remote-subpage-controls">
        <button
          className="subpage-btn"
          onClick={() => onSubpageChange('prev')}
          title="Previous Subpage (Arrow Left)"
        >
          &lt; PREV
        </button>
        <button
          className="subpage-btn"
          onClick={() => onSubpageChange('next')}
          title="Next Subpage (Arrow Right)"
        >
          NEXT &gt;
        </button>
      </div>

      {/* 3x4 numpad */}
      <div className="remote-numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className="numpad-btn"
            onClick={() => onDigitPress(String(num))}
          >
            {num}
          </button>
        ))}
        <button className="numpad-btn" onClick={onClear} title="Clear Input Buffer">
          CLR
        </button>
        <button className="numpad-btn" onClick={() => onDigitPress('0')}>
          0
        </button>
        <button
          className="numpad-btn"
          onClick={() => onNavigate('100')}
          title="Master Index"
        >
          IDX
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#718096' }}>
        PAGE {subpage} OF {totalSubpages}
      </div>
    </aside>
  );
};
