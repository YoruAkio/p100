// live usgs earthquake feed service for page 201 subpage 1

import { assembleFrame } from '../../teletext/formatter';
import { sanitizeTeletextString } from '../../teletext/sanitizer';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';
import { getCached } from '../cache';

interface USGSFeature {
  properties: {
    mag: number;
    place: string;
    time: number;
    alert: string | null;
    status: string;
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

// deterministic fallback seismic records
const FALLBACK_QUAKES = [
  { mag: 6.8, place: 'OFF COAST OF HONSHU, JAPAN', minsAgo: 14, alert: 'WARNING' },
  { mag: 5.7, place: 'BANDA SEA, INDONESIA', minsAgo: 42, alert: 'ALERT' },
  { mag: 5.2, place: 'KERMADEC ISLANDS REGION', minsAgo: 78, alert: 'NOTICE' },
  { mag: 4.8, place: 'SOUTHERN CALIFORNIA, USA', minsAgo: 110, alert: 'NOTICE' },
];

// fetch live usgs 4.5+ daily earthquakes with edge caching and timeout
// return assembled p201 subpage 1 frame
export async function getEarthquakePage(): Promise<TeletextFrameResponse> {
  let isFallback = false;
  let isCached = false;
  let quakes = FALLBACK_QUAKES;

  try {
    const { data, cached } = await getCached<USGSResponse>(
      'usgs-4.5-day',
      async () => {
        const res = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
          {
            signal: AbortSignal.timeout(3000),
            headers: { 'Accept': 'application/json' },
          },
        );
        if (!res.ok) {
          throw new Error(`USGS HTTP ${res.status}`);
        }
        return (await res.json()) as USGSResponse;
      },
      60,
    );

    isCached = cached;
    if (Array.isArray(data.features) && data.features.length > 0) {
      // sort severity-first (highest magnitude first)
      const sorted = [...data.features].sort((a, b) => (b.properties.mag ?? 0) - (a.properties.mag ?? 0));
      const now = Date.now();
      quakes = sorted.slice(0, 5).map((f) => {
        const mag = f.properties.mag ?? 4.5;
        const mins = Math.max(1, Math.round((now - f.properties.time) / 60000));
        const alert = mag >= 6.5 ? 'CRITICAL' : mag >= 5.5 ? 'WARNING' : 'ALERT';
        return {
          mag,
          place: sanitizeTeletextString(f.properties.place || 'PACIFIC SEISMIC ZONE').toUpperCase(),
          minsAgo: mins,
          alert,
        };
      });
    }
  } catch {
    isFallback = true;
  }

  const feedLabel = isFallback
    ? 'OFFLINE CACHE (FALLBACK)'
    : isCached
      ? 'EDGE CACHE (USGS 60S)'
      : 'LIVE USGS REALTIME';
  const feedColor = isFallback ? 'yellow' : isCached ? 'cyan' : 'green';

  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'red', b: 'red' },
      { t: ' USGS GLOBAL SEISMIC MONITOR (M4.5+) ', c: 'yellow', b: 'red', d: true },
      { t: ' ', c: 'red', b: 'red' },
    ],
    [
      { t: 'FEED: ', c: 'white' },
      { t: feedLabel, c: feedColor },
      { t: '  SORT: SEV', c: 'cyan' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
  ];

  for (const q of quakes) {
    const magStr = `M${q.mag.toFixed(1)}`;
    const timeStr = q.minsAgo >= 60 ? `${Math.floor(q.minsAgo / 60)}h ago` : `${q.minsAgo}m ago`;
    const badgeColor = q.alert === 'CRITICAL' ? 'red' : q.alert === 'WARNING' ? 'yellow' : 'green';

    bodyRows.push([
      { t: ` ${magStr} `, c: 'black', b: badgeColor },
      { t: ` ${q.alert.padEnd(8, ' ')}`, c: badgeColor },
      { t: timeStr.padStart(21, ' '), c: 'white' },
    ]);

    const placeTrimmed = q.place.slice(0, 38);
    bodyRows.push([
      { t: `  ${placeTrimmed}`, c: 'cyan' },
    ]);
  }

  bodyRows.push([]);
  bodyRows.push([
    { t: 'PRESS [RIGHT] OR [GREEN] FOR METEOROLOGY', c: 'yellow' },
  ]);

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'WEATHER' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '401', label: 'EMERGENCY' },
  };

  return assembleFrame({
    code: '201',
    subpage: 1,
    totalSubpages: 2,
    title: 'SEISMIC ALERTS',
    bodyRows,
    fastext,
    source: isFallback ? 'fallback' : 'live',
  });
}
