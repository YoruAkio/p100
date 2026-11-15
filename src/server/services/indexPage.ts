// master index page 100 service

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';

// generate master index teletext frame
// return assembled p100 frame
export function getIndexPage(): TeletextFrameResponse {
  const bodyRows: TeletextSpan[][] = [
    [
      { t: '========================================', c: 'blue' },
    ],
    [
      { t: ' P100 ', c: 'black', b: 'yellow', d: true },
      { t: ' TELETEXT CRISIS & TRANSIT PORTAL ', c: 'white', b: 'blue', d: true },
    ],
    [
      { t: '========================================', c: 'blue' },
    ],
    [],
    [
      { t: 'BROADCAST DIRECTORY:                    ', c: 'cyan', d: true },
    ],
    [
      { t: ' P100 ', c: 'black', b: 'yellow' },
      { t: ' MAIN INDEX & SYSTEM CLOCK', c: 'white' },
    ],
    [
      { t: ' P102 ', c: 'black', b: 'yellow' },
      { t: ' CRISIS BULLETINS & DIRECTIVES', c: 'white' },
    ],
    [
      { t: ' P201 ', c: 'black', b: 'yellow' },
      { t: ' SEISMIC ALERTS (USGS LIVE 4.5+)', c: 'red' },
    ],
    [
      { t: '      ', c: 'black', b: 'black' },
      { t: ' SUBPAGE 2: METEOROLOGICAL WARNINGS', c: 'yellow' },
    ],
    [
      { t: ' P301 ', c: 'black', b: 'yellow' },
      { t: ' METRO & REGIONAL RAIL STATUS', c: 'green' },
    ],
    [
      { t: ' P401 ', c: 'black', b: 'yellow' },
      { t: ' EMERGENCY HOTLINES & RELIEF AID', c: 'magenta' },
    ],
    [
      { t: ' P999 ', c: 'black', b: 'yellow' },
      { t: ' BYTE-BUDGET TELEMETRY & DIAGNOSTICS', c: 'cyan' },
    ],
    [],
    [
      { t: 'TRANSMITTER STATUS: ', c: 'green' },
      { t: 'NORMAL BROADCAST', c: 'white', b: 'green' },
    ],
    [
      { t: 'PAYLOAD CEILING:    ', c: 'white' },
      { t: '< 2048 BYTES (UTF-8)', c: 'yellow' },
    ],
    [
      { t: 'BANDWIDTH FOOTPRINT:', c: 'white' },
      { t: '99.9% SMALLER THAN WEB', c: 'green' },
    ],
    [],
    [
      { t: 'CONTROLS: ', c: 'yellow' },
      { t: 'TYPE 3 DIGITS (100-999)', c: 'white' },
    ],
    [
      { t: 'KEYS:     ', c: 'yellow' },
      { t: '[R]ED [G]REEN [Y]ELLOW [C]YAN', c: 'white' },
    ],
    [
      { t: 'SUBPAGES: ', c: 'yellow' },
      { t: '[LEFT] / [RIGHT] ARROW KEYS', c: 'white' },
    ],
  ];

  const fastext: FastextNav = {
    red: { code: '201', label: 'SEISMIC' },
    green: { code: '301', label: 'TRANSIT' },
    yellow: { code: '401', label: 'EMERGENCY' },
    cyan: { code: '999', label: 'DIAGNOSTIC' },
  };

  return assembleFrame({
    code: '100',
    subpage: 1,
    totalSubpages: 1,
    title: 'MASTER INDEX',
    bodyRows,
    fastext,
    source: 'live',
  });
}
