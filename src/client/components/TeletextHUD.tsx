// hud telemetry bar component

import React from 'react';

interface TeletextHUDProps {
  bytes: number;
  latencyMs: number;
  source: 'live' | 'cache' | 'fallback';
  slow2G: boolean;
  onToggleSlow2G: (enabled: boolean) => void;
  scanlines: boolean;
  onToggleScanlines: (enabled: boolean) => void;
  glow: boolean;
  onToggleGlow: (enabled: boolean) => void;
}

export const TeletextHUD: React.FC<TeletextHUDProps> = ({
  bytes,
  latencyMs,
  source,
  slow2G,
  onToggleSlow2G,
  scanlines,
  onToggleScanlines,
  glow,
  onToggleGlow,
}) => {
  const isBudgetOk = bytes < 2048;

  return (
    <header className="p100-hud">
      <div className="hud-left">
        <span className="hud-brand">P100 TELETEXT</span>
        <span
          className={`hud-badge ${isBudgetOk ? 'green' : 'red'}`}
          title="Strict payload ceiling under 2,048 bytes"
        >
          PAYLOAD: {bytes} BYTES {isBudgetOk ? '(< 2KB)' : '(EXCEEDED)'}
        </span>
        <span className="hud-badge yellow">
          LATENCY: {latencyMs}MS
        </span>
        <span
          className={`hud-badge ${
            source === 'live' ? 'green' : source === 'cache' ? 'yellow' : 'red'
          }`}
        >
          {source.toUpperCase()}
        </span>
      </div>

      <div className="hud-right">
        <label className="hud-toggle-label">
          <input
            type="checkbox"
            checked={slow2G}
            onChange={(e) => onToggleSlow2G(e.target.checked)}
          />
          SLOW-2G SIM (2500MS)
        </label>
        <label className="hud-toggle-label">
          <input
            type="checkbox"
            checked={scanlines}
            onChange={(e) => onToggleScanlines(e.target.checked)}
          />
          SCANLINES
        </label>
        <label className="hud-toggle-label">
          <input
            type="checkbox"
            checked={glow}
            onChange={(e) => onToggleGlow(e.target.checked)}
          />
          PHOSPHOR GLOW
        </label>
      </div>
    </header>
  );
};
