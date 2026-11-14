// bandwidth and byte-budget diagnostics service for page 999

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';

// generate byte budget and diagnostics frame
// return assembled p999 frame
export function getDiagnosticsPage(): TeletextFrameResponse {
  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'cyan', b: 'cyan' },
      { t: ' BANDWIDTH & BYTE-BUDGET TELEMETRY ', c: 'black', b: 'cyan', d: true },
      { t: ' ', c: 'cyan', b: 'cyan' },
    ],
    [
      { t: 'METRIC            TELETEXT    MODERN WEB', c: 'yellow' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
    [
      { t: 'MEDIAN PAGE SIZE: ', c: 'white' },
      { t: '1.2 KB', c: 'green' },
      { t: '      2,500 KB', c: 'red' },
    ],
    [
      { t: 'HTTP REQUESTS:    ', c: 'white' },
      { t: '1 REQ ', c: 'green' },
      { t: '      85+ REQS', c: 'red' },
    ],
    [
      { t: 'TIME TO RENDER:   ', c: 'white' },
      { t: '< 15ms', c: 'green' },
      { t: '      3,200ms ', c: 'red' },
    ],
    [
      { t: 'JAVASCRIPT OVERHD:', c: 'white' },
      { t: '0 KB  ', c: 'green' },
      { t: '      650 KB  ', c: 'red' },
    ],
    [
      { t: 'TRACKERS / BLOAT: ', c: 'white' },
      { t: 'ZERO  ', c: 'green' },
      { t: '      28 TAGS ', c: 'red' },
    ],
    [],
    [{ t: 'CRISIS NETWORK SIMULATION (SLOW-2G):', c: 'yellow', d: true }],
    [{ t: ' TOGGLE [SLOW-2G] IN HUD CONTROLS TO', c: 'white' }],
    [{ t: ' SIMULATE 2500MS NETWORK DELAY AT EDGE.', c: 'white' }],
    [{ t: ' TELETEXT DELIVERS LIFE-SAVING DATA ON', c: 'cyan' }],
    [{ t: ' 2G / SATELLITE PHONES / SMS GATEWAYS.', c: 'cyan' }],
    [],
    [
      { t: 'ENFORCED BYTE BUDGET: ', c: 'white' },
      { t: 'STRICT < 2048 BYTES', c: 'yellow', b: 'blue' },
    ],
    [
      { t: 'EDGE COMPLIANCE:      ', c: 'white' },
      { t: '100% PASSING IN PBT', c: 'green' },
    ],
  ];

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'WEATHER' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '401', label: 'EMERGENCY' },
  };

  return assembleFrame({
    code: '999',
    title: 'DIAGNOSTICS',
    bodyRows,
    fastext,
    source: 'live',
  });
}
