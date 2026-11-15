// unit and integration tests for edge services and api router

import { describe, expect, it } from 'vitest';
import app from '../src/server/index';
import { getBulletinPage } from '../src/server/services/bulletin';
import { getDiagnosticsPage } from '../src/server/services/diagnostics';
import { getEarthquakePage } from '../src/server/services/earthquake';
import { getEmergencyPage } from '../src/server/services/emergency';
import { getIndexPage } from '../src/server/services/indexPage';
import { getTransitPage } from '../src/server/services/transit';
import { getWeatherPage } from '../src/server/services/weather';
import { getCached } from '../src/server/cache';
import { transmitBell202Afsk } from '../src/client/audio';
import { TeletextFrameResponse } from '../src/teletext/types';
import fs from 'node:fs';
import path from 'node:path';

describe('Teletext Edge Services', () => {
  it('returns valid master index page 100', () => {
    const page = getIndexPage();
    expect(page.code).toBe('100');
    expect(page.title).toBe('MASTER INDEX');
    expect(page.rows.length).toBe(24);
    expect(page.fastext.red.code).toBe('201');
    expect(page.fastext.green.code).toBe('301');
  });

  it('returns seismic alert page 201 subpage 1', async () => {
    const page = await getEarthquakePage();
    expect(page.code).toBe('201');
    expect(page.subpage).toBe(1);
    expect(page.totalSubpages).toBe(2);
    expect(page.rows.length).toBe(24);
  });

  it('returns meteorological severe radar page 201 subpage 2', async () => {
    const page = await getWeatherPage();
    expect(page.code).toBe('201');
    expect(page.subpage).toBe(2);
    expect(page.rows.length).toBe(24);
  });

  it('returns transit board page 301 with operational lines', () => {
    const page = getTransitPage();
    expect(page.code).toBe('301');
    expect(page.rows.length).toBe(24);
  });

  it('returns emergency directory page 401 with hotlines', () => {
    const page = getEmergencyPage();
    expect(page.code).toBe('401');
    expect(page.rows.length).toBe(24);
  });

  it('returns civil defense crisis bulletins page 102', () => {
    const page = getBulletinPage();
    expect(page.code).toBe('102');
    expect(page.title).toBe('CRISIS BULLETINS');
    expect(page.rows.length).toBe(24);
    expect(page.bytes).toBeLessThan(2048);
  });

  it('returns diagnostics page 999 with telemetry', () => {
    const page = getDiagnosticsPage();
    expect(page.code).toBe('999');
    expect(page.rows.length).toBe(24);
  });
});

describe('Hono Edge Router Endpoints', () => {
  it('handles GET /api/health', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('ok');
  });

  it('handles GET /api/page/100 and sets correct teletext headers', async () => {
    const res = await app.request('/api/page/100');
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Teletext-Grid')).toBe('40x24');
    expect(res.headers.get('X-Teletext-Page')).toBe('100');

    const bytesHeader = Number(res.headers.get('X-Teletext-Bytes'));
    expect(bytesHeader).toBeLessThan(2048);

    const data = (await res.json()) as TeletextFrameResponse;
    expect(data.code).toBe('100');
    expect(data.rows.length).toBe(24);
  });

  it('handles GET /api/page/102 and returns crisis bulletins with cache header', async () => {
    const res = await app.request('/api/page/102');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=300');
    const data = (await res.json()) as TeletextFrameResponse;
    expect(data.code).toBe('102');
    expect(data.rows.length).toBe(24);
  });

  it('sets short cache-control header on dynamic page 201', async () => {
    const res = await app.request('/api/page/201');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=15');
  });

  it('handles subpage queries for page 201', async () => {
    const res1 = await app.request('/api/page/201?subpage=1');
    expect(res1.status).toBe(200);
    const data1 = (await res1.json()) as TeletextFrameResponse;
    expect(data1.subpage).toBe(1);

    const res2 = await app.request('/api/page/201?subpage=2');
    expect(res2.status).toBe(200);
    const data2 = (await res2.json()) as TeletextFrameResponse;
    expect(data2.subpage).toBe(2);
  });

  it('routes invalid page code 9999 to 404 with safe teletext frame', async () => {
    const res = await app.request('/api/page/9999');
    expect(res.status).toBe(404);
    const data = (await res.json()) as TeletextFrameResponse;
    expect(data.code).toBe('404');
    expect(data.rows.length).toBe(24);
  });

  it('routes malicious or path injection codes to 404 safely', async () => {
    const res = await app.request('/api/page/..%2F..%2Fetc%2Fpasswd');
    expect(res.status).toBe(404);
    const data = (await res.json()) as TeletextFrameResponse;
    expect(data.code).toBe('404');
  });

  it('handles localized weather queries with lat and lon parameters', async () => {
    const res = await app.request('/api/page/201?subpage=2&lat=35.6762&lon=139.6503');
    expect(res.status).toBe(200);
    const data = (await res.json()) as TeletextFrameResponse;
    expect(data.subpage).toBe(2);
    expect(data.rows.length).toBe(24);
    expect(data.bytes).toBeLessThan(2048);
    // checks that coords row contains formatted coordinates
    const allText = data.rows.map((r) => r.map((s) => s.t).join('')).join('\n');
    expect(allText).toContain('35.68N 139.65E');
  });
});

describe('Edge Resilient Cache Helper', () => {
  it('caches results and reuses them within TTL', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { timestamp: Date.now(), count: callCount };
    };

    const first = await getCached('test-key', fetcher, 5);
    expect(first.cached).toBe(false);
    expect(first.data.count).toBe(1);

    const second = await getCached('test-key', fetcher, 5);
    expect(second.cached).toBe(true);
    expect(second.data.count).toBe(1);
    expect(callCount).toBe(1);
  });
});

describe('Bell 202 AFSK 1200 Audio Modulation', () => {
  it('safely handles disabled or headless environments without errors', () => {
    const disabled = transmitBell202Afsk('P100 EMERGENCY ALERT', false);
    expect(disabled).toBeNull();

    // in headless / node environment without Web Audio API, returns null cleanly
    const result = transmitBell202Afsk('P100 EMERGENCY ALERT', true);
    // either returns transmission object if Web Audio mocked/present, or null safely
    if (result) {
      expect(typeof result.stop).toBe('function');
      expect(result.durationMs).toBeGreaterThan(0);
    } else {
      expect(result).toBeNull();
    }
  });
});

describe('Offline Crisis PWA & Service Worker', () => {
  it('provides valid service worker and web app manifest in public directory', () => {
    const swPath = path.resolve(__dirname, '../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('/api/page/');

    const manifestPath = path.resolve(__dirname, '../public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifestJson.name).toBe('P100 Teletext Crisis Portal');
    expect(manifestJson.display).toBe('standalone');
  });
});
