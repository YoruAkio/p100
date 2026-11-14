// emergency directory and crisis hotlines service for page 401

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';

// generate emergency hotlines and relief directory
// return assembled p401 frame
export function getEmergencyPage(): TeletextFrameResponse {
  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'red', b: 'red' },
      { t: ' EMERGENCY AID & CRISIS DIRECTORY ', c: 'yellow', b: 'red', d: true },
      { t: ' ', c: 'red', b: 'red' },
    ],
    [
      { t: 'OFFLINE RESILIENT BROADCAST REGISTRY', c: 'white' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
    [
      { t: 'ALL-SERVICES EMERGENCY: ', c: 'yellow' },
      { t: '112 / 999', c: 'white', b: 'red' },
    ],
    [
      { t: 'DISASTER RELIEF HQ:     ', c: 'yellow' },
      { t: '0800-440-900', c: 'white' },
    ],
    [
      { t: 'MEDICAL TRIAGE HOTLINE: ', c: 'yellow' },
      { t: '0800-111-222', c: 'white' },
    ],
    [
      { t: 'COASTAL SEARCH & RESCUE:', c: 'yellow' },
      { t: 'VHF CH 16', c: 'cyan' },
    ],
    [],
    [{ t: 'EMERGENCY RADIO FREQUENCIES (MW/FM):', c: 'green', d: true }],
    [
      { t: ' CIVIL DEFENSE PRIMARY:  AM 680 KHZ', c: 'white' },
    ],
    [
      { t: ' METEOROLOGY BULLETIN:   FM 98.5 MHZ', c: 'white' },
    ],
    [
      { t: ' SHORTWAVE RELIEF NET:   7.125 MHZ', c: 'white' },
    ],
    [],
    [{ t: 'CRISIS PROTOCOL CHECKLIST:', c: 'cyan' }],
    [{ t: ' 1. MAINTAIN BATTERY RADIO POWER', c: 'white' }],
    [{ t: ' 2. STORE 3 LITERS WATER PER PERSON/DAY', c: 'white' }],
    [{ t: ' 3. DESIGNATED SHELTER: CENTRAL ARENA', c: 'yellow' }],
    [{ t: ' 4. FOLLOW TELETEXT UPDATES ON P100/P201', c: 'white' }],
    [],
    [{ t: 'ALL TELECOMMUNICATION TOWERS ON DIESEL', c: 'green' }],
  ];

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'SEISMIC' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '999', label: 'DIAGNOSTIC' },
  };

  return assembleFrame({
    code: '401',
    title: 'EMERGENCY AID',
    bodyRows,
    fastext,
    source: 'live',
  });
}
