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
import { TeletextFrameResponse } from '../src/teletext/types';

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
});
