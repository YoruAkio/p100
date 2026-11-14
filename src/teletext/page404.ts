// deterministic teletext 404 page frame generator

import { assembleFrame } from './formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from './types';

// generate standardized teletext 404 frame
// param invalidCode the requested invalid or unknown page code
// return assembled 404 frame
export function generatePage404(invalidCode: string = '404'): TeletextFrameResponse {
  const safeCode = (invalidCode || '???').slice(0, 8);

  const bodyRows: TeletextSpan[][] = [
    [],
    [
      { t: ' ', c: 'red', b: 'red' },
      { t: ' PAGE NOT FOUND / UNALLOCATED ', c: 'yellow', b: 'red', d: true },
      { t: ' ', c: 'red', b: 'red' },
    ],
    [],
    [
      { t: 'REQUESTED: ', c: 'white' },
      { t: safeCode, c: 'magenta' },
      { t: ' IS NOT IN THE BROADCAST.', c: 'white' },
    ],
    [],
    [{ t: 'AVAILABLE BROADCAST CHANNELS:', c: 'cyan', d: true }],
    [{ t: '----------------------------------------', c: 'blue' }],
    [
      { t: ' P100 ', c: 'black', b: 'yellow' },
      { t: ' MASTER INDEX & CLOCK', c: 'white' },
    ],
    [
      { t: ' P201 ', c: 'black', b: 'yellow' },
      { t: ' LIVE WEATHER & SEISMIC ALERTS', c: 'white' },
    ],
    [
      { t: ' P301 ', c: 'black', b: 'yellow' },
      { t: ' TRANSIT & RAIL LINE STATUS', c: 'white' },
    ],
    [
      { t: ' P401 ', c: 'black', b: 'yellow' },
      { t: ' EMERGENCY AID & HOTLINES', c: 'white' },
    ],
    [
      { t: ' P999 ', c: 'black', b: 'yellow' },
      { t: ' BANDWIDTH DIAGNOSTICS', c: 'white' },
    ],
    [],
    [{ t: 'NAVIGATION TIPS:', c: 'green' }],
    [{ t: ' * TYPE 3 DIGITS (100-999) TO JUMP', c: 'white' }],
    [{ t: ' * USE FASTEXT KEYS [R, G, Y, C]', c: 'white' }],
    [{ t: ' * PRESS [LEFT/RIGHT] TO CHANGE PAGE', c: 'white' }],
    [],
    [{ t: 'TRANSMITTER STATUS: ONLINE (CF EDGE)', c: 'cyan' }],
  ];

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'WEATHER' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '401', label: 'EMERGENCY' },
  };

  return assembleFrame({
    code: '404',
    title: 'PAGE NOT FOUND',
    bodyRows,
    fastext,
    source: 'fallback',
  });
}
