// retro broadcast telemetry rack-mount unit component

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
  convex: boolean;
  onToggleConvex: (enabled: boolean) => void;
  audio: boolean;
  onToggleAudio: (enabled: boolean) => void;
  hold: boolean;
  copied: boolean;
  afskActive?: boolean;
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
  convex,
  onToggleConvex,
  audio,
  onToggleAudio,
  hold,
  copied,
  afskActive = false,
}) => {
  const isBudgetOk = bytes < 2048;

  return (
    <header className="retro-rack-hud">
      {/* corner mounting screw accents */}
      <span className="rack-screw top-left" aria-hidden="true" />
      <span className="rack-screw top-right" aria-hidden="true" />
      <span className="rack-screw bottom-left" aria-hidden="true" />
      <span className="rack-screw bottom-right" aria-hidden="true" />

      {/* unit identifier */}
      <div className="rack-section rack-id">
        <div className="rack-model">DEMOD-84 VBI RECEIVER</div>
        <div className="rack-title">KIRO-WST BROADCAST MONITOR</div>
      </div>

      {/* digital telemetry readouts */}
      <div className="rack-section rack-meters">
        {/* payload meter */}
        <div className="led-readout-panel">
          <span className="led-label">BYTE BUDGET (&lt;2048B)</span>
          <div className={`led-display ${isBudgetOk ? 'led-green' : 'led-red'}`}>
            <span className="led-digits">{String(bytes).padStart(4, '0')} B</span>
            <span className="led-status-dot" />
          </div>
        </div>

        {/* latency meter */}
        <div className="led-readout-panel">
          <span className="led-label">CARRIER LATENCY</span>
          <div className="led-display led-amber">
            <span className="led-digits">{String(latencyMs).padStart(4, ' ')} MS</span>
          </div>
        </div>

        {/* signal source / status */}
        <div className="led-readout-panel">
          <span className="led-label">TRANSMITTER</span>
          <div
            className={`led-display ${
              source === 'live' ? 'led-green' : source === 'cache' ? 'led-amber' : 'led-red'
            }`}
          >
            <span className="led-digits">{source.toUpperCase()}</span>
          </div>
        </div>

        {/* subpage mode indicator */}
        <div className="led-readout-panel">
          <span className="led-label">SUBPAGE FEED</span>
          <div className={`led-display ${hold ? 'led-amber' : 'led-green'}`}>
            <span className="led-digits">{hold ? 'HOLD' : 'AUTO-ROLL'}</span>
          </div>
        </div>

        {/* bell 202 modem indicator */}
        <div className="led-readout-panel">
          <span className="led-label">BELL 202 MODEM</span>
          <div className={`led-display ${afskActive ? 'led-red blink' : 'led-amber'}`}>
            <span className="led-digits">{afskActive ? 'TX 1200' : 'STANDBY'}</span>
          </div>
        </div>

        {/* vbi carrier vu meter */}
        <div className="vu-meter-panel">
          <span className="led-label">RF VBI SIGNAL</span>
          <div className="vu-bar-graph" title="RF Carrier Signal Lock">
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className="vu-seg on" />
            <span className={`vu-seg ${source === 'live' ? 'on yellow' : ''}`} />
            <span className={`vu-seg ${source === 'live' ? 'on red' : ''}`} />
          </div>
        </div>
      </div>

      {/* hardware toggle switches */}
      <div className="rack-section rack-toggles">
        <label className="toggle-switch-wrapper" title="Simulate Slow-2G / 2,500ms Edge Latency">
          <input
            type="checkbox"
            checked={slow2G}
            onChange={(e) => onToggleSlow2G(e.target.checked)}
          />
          <span className="toggle-switch-lever" />
          <span className="toggle-switch-label">SLOW-2G</span>
        </label>

        <label className="toggle-switch-wrapper" title="Toggle Raster Scanlines">
          <input
            type="checkbox"
            checked={scanlines}
            onChange={(e) => onToggleScanlines(e.target.checked)}
          />
          <span className="toggle-switch-lever" />
          <span className="toggle-switch-label">SCANLINES</span>
        </label>

        <label className="toggle-switch-wrapper" title="Toggle Phosphor Bloom & Glow">
          <input
            type="checkbox"
            checked={glow}
            onChange={(e) => onToggleGlow(e.target.checked)}
          />
          <span className="toggle-switch-lever" />
          <span className="toggle-switch-label">GLOW</span>
        </label>

        <label className="toggle-switch-wrapper" title="Toggle 3D Convex CRT Bulb Curvature">
          <input
            type="checkbox"
            checked={convex}
            onChange={(e) => onToggleConvex(e.target.checked)}
          />
          <span className="toggle-switch-lever" />
          <span className="toggle-switch-label">CONVEX TV</span>
        </label>

        <label className="toggle-switch-wrapper" title="Toggle 1980s Synthesized Audio Effects">
          <input
            type="checkbox"
            checked={audio}
            onChange={(e) => onToggleAudio(e.target.checked)}
          />
          <span className="toggle-switch-lever" />
          <span className="toggle-switch-label">AUDIO FX</span>
        </label>
      </div>
    </header>
  );
};
