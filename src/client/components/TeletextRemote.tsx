// tactile retro 1980s infrared remote commander component

import React from 'react';
import { FastextNav } from '../../teletext/types';

interface TeletextRemoteProps {
  inputBuffer: string;
  currentPage: string;
  subpage: number;
  totalSubpages: number;
  fastext: FastextNav;
  hold: boolean;
  onToggleHold: () => void;
  onCopyFrame: () => void;
  copied: boolean;
  onTransmitAfsk: () => void;
  afskActive: boolean;
  onDigitPress: (digit: string) => void;
  onClear: () => void;
  onSubpageChange: (direction: 'prev' | 'next') => void;
  onNavigate: (code: string) => void;
  irBlink: boolean;
}

export const TeletextRemote: React.FC<TeletextRemoteProps> = ({
  inputBuffer,
  currentPage,
  subpage,
  totalSubpages,
  fastext,
  hold,
  onToggleHold,
  onCopyFrame,
  copied,
  onTransmitAfsk,
  afskActive,
  onDigitPress,
  onClear,
  onSubpageChange,
  onNavigate,
  irBlink,
}) => {
  const displayBuffer = inputBuffer
    ? `P${inputBuffer.padEnd(3, '_')}`
    : `P${currentPage}`;

  return (
    <aside className="vintage-remote-commander">
      {/* infrared diode window at top */}
      <div className="remote-ir-head">
        <span className={`remote-ir-emitter ${irBlink ? 'ir-transmitting' : ''}`} />
        <span className="remote-brand-tag">INFRARED RC-84</span>
      </div>

      <div className="remote-inner-body">
        {/* vintage segmented lcd page readout */}
        <div className="remote-lcd-window">
          <div className="lcd-header">PAGE MEMORY</div>
          <div className="lcd-digits">{displayBuffer}</div>
          <div className="lcd-sub-info">
            SUB {subpage}/{totalSubpages} {hold ? '[HOLD]' : '[ROLL]'}
          </div>
        </div>

        {/* fastext rubber dome buttons */}
        <div className="remote-section-title">FASTEXT DIRECT ACCESS</div>
        <div className="remote-fastext-grid">
          <button
            className="remote-rubber-btn fastext-red"
            onClick={() => onNavigate(fastext.red.code)}
            title={`Red Fastext: P${fastext.red.code} (${fastext.red.label})`}
          >
            <span className="key-tag">R</span>
            <span className="key-code">{fastext.red.code}</span>
          </button>
          <button
            className="remote-rubber-btn fastext-green"
            onClick={() => onNavigate(fastext.green.code)}
            title={`Green Fastext: P${fastext.green.code} (${fastext.green.label})`}
          >
            <span className="key-tag">G</span>
            <span className="key-code">{fastext.green.code}</span>
          </button>
          <button
            className="remote-rubber-btn fastext-yellow"
            onClick={() => onNavigate(fastext.yellow.code)}
            title={`Yellow Fastext: P${fastext.yellow.code} (${fastext.yellow.label})`}
          >
            <span className="key-tag">Y</span>
            <span className="key-code">{fastext.yellow.code}</span>
          </button>
          <button
            className="remote-rubber-btn fastext-cyan"
            onClick={() => onNavigate(fastext.cyan.code)}
            title={`Cyan Fastext: P${fastext.cyan.code} (${fastext.cyan.label})`}
          >
            <span className="key-tag">C</span>
            <span className="key-code">{fastext.cyan.code}</span>
          </button>
        </div>

        {/* subpage carousel rocker & hold toggle */}
        <div className="remote-subpage-rocker">
          <button
            className="rocker-btn"
            onClick={() => onSubpageChange('prev')}
            title="Previous Subpage (Arrow Left)"
          >
            &lt; SUB
          </button>
          <button
            className={`rocker-btn btn-hold ${hold ? 'hold-active' : ''}`}
            onClick={onToggleHold}
            title="Toggle Subpage Auto-Roll / Hold (Space key)"
          >
            {hold ? 'HOLD' : 'ROLL'}
          </button>
          <button
            className="rocker-btn"
            onClick={() => onSubpageChange('next')}
            title="Next Subpage (Arrow Right)"
          >
            SUB &gt;
          </button>
        </div>

        {/* numeric keypad */}
        <div className="remote-section-title">DIRECT NUMERIC DIAL</div>
        <div className="remote-numpad-matrix">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className="numpad-key"
              onClick={() => onDigitPress(String(num))}
            >
              {num}
            </button>
          ))}
          <button
            className="numpad-key key-clear"
            onClick={onClear}
            title="Clear Digits"
          >
            CLR
          </button>
          <button
            className="numpad-key"
            onClick={() => onDigitPress('0')}
          >
            0
          </button>
          <button
            className="numpad-key key-idx"
            onClick={() => onNavigate('100')}
            title="Master Index P100"
          >
            IDX
          </button>
        </div>

        {/* disaster radio packet export */}
        <div className="remote-utility-actions">
          <button
            className={`remote-util-btn ${copied ? 'btn-copied' : ''}`}
            onClick={onCopyFrame}
            title="Export raw 40x24 ASCII packet for LoRa, HAM radio, or emergency SMS (Key X)"
          >
            {copied ? 'PACKET COPIED' : 'COPY RADIO PACKET'}
          </button>
          <button
            className={`remote-util-btn btn-afsk ${afskActive ? 'afsk-transmitting' : ''}`}
            onClick={onTransmitAfsk}
            title="Broadcast Bell 202 AFSK 1200 baud audio packet via speaker (Key B)"
          >
            {afskActive ? 'TX AFSK 1200...' : 'BROADCAST AFSK'}
          </button>
        </div>

        <div className="remote-bottom-badge">
          <span>KIRO TELETEXT SYSTEM</span>
        </div>
      </div>
    </aside>
  );
};
