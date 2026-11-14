// transit and rail status board service for page 301

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';

interface TransitLine {
  name: string;
  status: 'ON TIME' | 'DELAYED' | 'SUSPENDED';
  advisory: string;
}

const TRANSIT_LINES: TransitLine[] = [
  { name: 'METRO CENTRAL LINE', status: 'ON TIME', advisory: 'NORMAL SERVICE EVERY 4 MIN' },
  { name: 'COASTAL EXPRESS', status: 'DELAYED', advisory: 'DEBRIS ON TRACK NEAR SECTOR 4' },
  { name: 'NORTHERN COMMUTER', status: 'ON TIME', advisory: 'OPERATING UNDER CLEARANCE' },
  { name: 'VALLEY REGIONAL', status: 'SUSPENDED', advisory: 'FLOOD ALERT - SHUTTLES ACTIVE' },
  { name: 'AIRPORT SHUTTLE', status: 'ON TIME', advisory: 'REGULAR SCHEDULE RESTORED' },
];

// generate transit line status board
// return assembled p301 frame
export function getTransitPage(): TeletextFrameResponse {
  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'blue', b: 'blue' },
      { t: ' METRO & REGIONAL TRANSIT BOARD ', c: 'white', b: 'blue', d: true },
      { t: ' ', c: 'blue', b: 'blue' },
    ],
    [
      { t: 'NETWORK DISPATCH: ', c: 'white' },
      { t: 'ALL SECTORS MONITORED', c: 'green' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
  ];

  for (const line of TRANSIT_LINES) {
    const statusBg =
      line.status === 'ON TIME' ? 'green' : line.status === 'DELAYED' ? 'yellow' : 'red';
    const statusFg = line.status === 'ON TIME' ? 'white' : 'black';

    bodyRows.push([
      { t: line.name.padEnd(26, ' '), c: 'cyan' },
      { t: ` ${line.status} `, c: statusFg, b: statusBg },
    ]);

    bodyRows.push([
      { t: `  ${line.advisory.slice(0, 38)}`, c: 'white' },
    ]);
  }

  bodyRows.push([]);
  bodyRows.push([{ t: 'EMERGENCY SHUTTLE BUS INFORMATION:', c: 'yellow' }]);
  bodyRows.push([{ t: ' BUS ROUTE B-12 RUNNING BETWEEN STATIONS', c: 'white' }]);
  bodyRows.push([{ t: ' TICKETS HONORED ACROSS ALL CARRIERS', c: 'green' }]);

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'WEATHER' },
    yellow: { code: '401', label: 'EMERGENCY' },
    cyan: { code: '999', label: 'DIAGNOSTIC' },
  };

  return assembleFrame({
    code: '301',
    title: 'TRANSIT BOARD',
    bodyRows,
    fastext,
    source: 'live',
  });
}
