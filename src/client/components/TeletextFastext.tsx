// fastext interactive row 24 component

import React from 'react';
import { FastextNav } from '../../teletext/types';

interface TeletextFastextProps {
  fastext: FastextNav;
  onNavigate: (code: string) => void;
}

export const TeletextFastext: React.FC<TeletextFastextProps> = ({
  fastext,
  onNavigate,
}) => {
  const items = [
    { item: fastext.red, fg: 'fg-white', bg: 'bg-red', key: 'R' },
    { item: fastext.green, fg: 'fg-black', bg: 'bg-green', key: 'G' },
    { item: fastext.yellow, fg: 'fg-black', bg: 'bg-yellow', key: 'Y' },
    { item: fastext.cyan, fg: 'fg-black', bg: 'bg-cyan', key: 'C' },
  ];

  return (
    <div className="tt-row">
      {items.map(({ item, fg, bg, key }, idx) => {
        const text = `${item.code} ${item.label}`.slice(0, 10).padEnd(10, ' ');
        return (
          <button
            key={idx}
            className={`tt-span fastext-button ${fg} ${bg}`}
            style={{ width: '10ch', display: 'inline-block' }}
            onClick={() => onNavigate(item.code)}
            title={`Jump to P${item.code} (Shortcut: ${key})`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};
