// live open-meteo weather and severe alerts service for page 201 subpage 2

import { assembleFrame } from '../../teletext/formatter';
import { FastextNav, TeletextFrameResponse, TeletextSpan } from '../../teletext/types';
import { getCached } from '../cache';

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    surface_pressure?: number;
  };
}

// weather code description decoder
function decodeWeatherCode(code?: number): { condition: string; sev: string } {
  if (code === undefined) return { condition: 'VARIABLE CONDITIONS', sev: 'NOTICE' };
  if (code >= 95) return { condition: 'SEVERE THUNDERSTORM / SQUALL', sev: 'CRITICAL' };
  if (code >= 80) return { condition: 'HEAVY PRECIPITATION SHOWERS', sev: 'WARNING' };
  if (code >= 71) return { condition: 'SNOW / BLIZZARD ADVISORY', sev: 'WARNING' };
  if (code >= 61) return { condition: 'CONTINUOUS RAINFALL / FLOOD RISK', sev: 'ALERT' };
  if (code >= 51) return { condition: 'LIGHT DRIZZLE / REDUCED VIS', sev: 'NOTICE' };
  if (code >= 45) return { condition: 'DENSE FOG / HAZARDOUS TRAVEL', sev: 'ALERT' };
  return { condition: 'FAIR WEATHER / MODERATE WINDS', sev: 'CLEAR' };
}

// fallback meteorological records
const FALLBACK_WEATHER = {
  temp: 14.2,
  humidity: 82,
  windSpeed: 48.5,
  pressure: 994.2,
  condition: 'GALE FORCE STORM INCOMING',
  sev: 'WARNING',
};

// fetch open-meteo severe weather and metrics with edge cache and localized coordinates
// return assembled p201 subpage 2 frame
export async function getWeatherPage(
  lat = 51.5074,
  lon = -0.1278,
): Promise<TeletextFrameResponse> {
  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : 51.5074;
  const safeLon = typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180 ? lon : -0.1278;

  let isFallback = false;
  let isCached = false;
  let metrics = FALLBACK_WEATHER;

  const cacheKey = `weather-${safeLat.toFixed(2)}_${safeLon.toFixed(2)}`;

  try {
    const { data, cached } = await getCached<OpenMeteoResponse>(
      cacheKey,
      async () => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${safeLat.toFixed(4)}&longitude=${safeLon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,surface_pressure`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(3000),
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`Open-Meteo HTTP ${res.status}`);
        }
        return (await res.json()) as OpenMeteoResponse;
      },
      120,
    );

    isCached = cached;
    if (data.current) {
      const decoded = decodeWeatherCode(data.current.weather_code);
      metrics = {
        temp: data.current.temperature_2m ?? 15,
        humidity: data.current.relative_humidity_2m ?? 70,
        windSpeed: data.current.wind_speed_10m ?? 20,
        pressure: data.current.surface_pressure ?? 1013,
        condition: decoded.condition,
        sev: decoded.sev,
      };
    }
  } catch {
    isFallback = true;
  }

  const badgeColor = metrics.sev === 'CRITICAL' ? 'red' : metrics.sev === 'WARNING' ? 'yellow' : 'green';

  const latDir = safeLat >= 0 ? 'N' : 'S';
  const lonDir = safeLon >= 0 ? 'E' : 'W';
  const coordStr = `${Math.abs(safeLat).toFixed(2)}${latDir} ${Math.abs(safeLon).toFixed(2)}${lonDir}`;
  const sourceStr = isFallback
    ? 'OFFLINE CACHE'
    : isCached
      ? 'EDGE CACHE (120S)'
      : 'OPEN-METEO LIVE';

  const bodyRows: TeletextSpan[][] = [
    [
      { t: ' ', c: 'blue', b: 'blue' },
      { t: ' METEOROLOGICAL SEVERE WEATHER RADAR ', c: 'yellow', b: 'blue', d: true },
      { t: ' ', c: 'blue', b: 'blue' },
    ],
    [
      { t: 'LOC: ', c: 'yellow' },
      { t: coordStr.padEnd(16, ' '), c: 'white' },
      { t: ` ${sourceStr}`.padStart(19, ' '), c: isFallback ? 'yellow' : isCached ? 'cyan' : 'green' },
    ],
    [{ t: '----------------------------------------', c: 'blue' }],
    [
      { t: 'ADVISORY: ', c: 'white' },
      { t: ` ${metrics.sev} `, c: 'black', b: badgeColor },
      { t: ` ${metrics.condition}`.slice(0, 26), c: badgeColor },
    ],
    [],
    [
      { t: 'SURFACE TEMP:    ', c: 'cyan' },
      { t: `${metrics.temp.toFixed(1)} C`.padStart(23, ' '), c: 'white' },
    ],
    [
      { t: 'RELATIVE HUMID:  ', c: 'cyan' },
      { t: `${metrics.humidity.toFixed(0)} %`.padStart(23, ' '), c: 'white' },
    ],
    [
      { t: 'WIND VELOCITY:   ', c: 'cyan' },
      { t: `${metrics.windSpeed.toFixed(1)} KM/H`.padStart(23, ' '), c: metrics.windSpeed > 40 ? 'yellow' : 'white' },
    ],
    [
      { t: 'BAROMETER:       ', c: 'cyan' },
      { t: `${metrics.pressure.toFixed(1)} HPA`.padStart(23, ' '), c: 'white' },
    ],
    [],
    [{ t: 'REGIONAL CRISIS OUTLOOK:', c: 'yellow' }],
    [{ t: ' COASTAL SECTOR: HIGH SURGE ADVISORY', c: 'white' }],
    [{ t: ' INLAND SECTOR:  ISOLATED FLOOD RISKS', c: 'white' }],
    [{ t: ' TRANSPORT:      SPEED RESTRICTIONS ACTIVE', c: 'white' }],
    [],
    [{ t: 'DISASTER RELIEF READINESS: DEFCON 2', c: 'green' }],
    [],
    [{ t: 'PRESS [LEFT] FOR SEISMIC FEED (1/2)', c: 'yellow' }],
  ];

  const fastext: FastextNav = {
    red: { code: '100', label: 'INDEX' },
    green: { code: '201', label: 'SEISMIC' },
    yellow: { code: '301', label: 'TRANSIT' },
    cyan: { code: '401', label: 'EMERGENCY' },
  };

  return assembleFrame({
    code: '201',
    subpage: 2,
    totalSubpages: 2,
    title: 'METEOROLOGY',
    bodyRows,
    fastext,
    source: isFallback ? 'fallback' : 'live',
  });
}
