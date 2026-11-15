// civil defense and crisis advisory service for page 102

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';

// generate civil defense bulletins and emergency directives
// return assembled p102 frame
export function getBulletinPage(): TeletextFrameResponse {
  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'red', b: 'red' },
      { t: ' CIVIL DEFENSE CRISIS BULLETINS ', c: 'yellow', b: 'red', d: true },
      { t: ' ', c: 'red', b: 'red' },
    ],
    [
      { t: 'STATE OF READINESS: ', c: 'white' },
      { t: ' LEVEL ORANGE ', c: 'black', b: 'yellow' },
      { t: ' ACTIVE ALERT', c: 'yellow' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
    [
      { t: 'DIRECTIVE 04-B: ', c: 'cyan' },
      { t: 'PUBLIC SHELTER ADVISORY', c: 'white' },
    ],
    [{ t: ' SECTOR 1-3 EVACUATION: USE ROUTE N-7', c: 'yellow' }],
    [{ t: ' STADIUM SHELTER CAPACITY: 68% OCCUPIED', c: 'white' }],
    [{ t: ' HIGH-GROUND REFUGE: NORTHERN RIDGELINE', c: 'green' }],
    [],
    [
      { t: 'SUPPLY & RATIONING LOGISTICS:', c: 'cyan', d: true },
    ],
    [{ t: ' WATER DISTRIBUTION: CENTRAL TERMINAL', c: 'white' }],
    [{ t: ' HOURS: 07:00 - 19:00 DAILY (MAX 4L/P)', c: 'yellow' }],
    [{ t: ' EMERGENCY MEDICAL POST: FIELD HOSP 2', c: 'white' }],
    [],
    [
      { t: 'GRID & TELECOMMUNICATIONS DIRECTIVE:', c: 'cyan' },
    ],
    [{ t: ' CELL NETWORKS CONGESTED: USE P100 / SMS', c: 'yellow' }],
    [{ t: ' POWER ROTATION: SECTOR 4 FROM 20:00', c: 'white' }],
    [{ t: ' DIESEL RELAY TOWERS CONFIRMED OPERATIONAL', c: 'green' }],
    [],
    [
      { t: 'RADIO BROADCAST: ', c: 'white' },
      { t: 'AM 680 KHZ', c: 'green' },
      { t: ' / ', c: 'white' },
      { t: 'FM 98.5 MHZ', c: 'green' },
    ],
    [],
    [{ t: 'MONITOR TELETEXT FOR ROLLING DISPATCHES', c: 'yellow' }],
  ];

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'SEISMIC' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '401', label: 'EMERGENCY' },
  };

  return assembleFrame({
    code: '102',
    title: 'CRISIS BULLETINS',
    bodyRows,
    fastext,
    source: 'live',
  });
}
