// hono application entry point and teletext page dispatcher

import { Hono } from 'hono';
import { generatePage404 } from '../teletext/page404';
import { TeletextFrameResponse } from '../teletext/types';
import { checkByteBudget, isValidPageCode } from '../teletext/validator';
import { getDiagnosticsPage } from './services/diagnostics';
import { getEarthquakePage } from './services/earthquake';
import { getEmergencyPage } from './services/emergency';
import { getIndexPage } from './services/indexPage';
import { getBulletinPage } from './services/bulletin';
import { getTransitPage } from './services/transit';
import { getWeatherPage } from './services/weather';

type Bindings = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: Bindings }>();

// health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    system: 'P100 Teletext Edge Transmitter',
    time: new Date().toISOString(),
  });
});

// teletext page dispatch endpoint
app.get('/api/page/:code', async (c) => {
  const code = c.req.param('code');
  const subpageParam = c.req.query('subpage');
  const subpage = subpageParam ? parseInt(subpageParam, 10) : 1;

  if (!isValidPageCode(code)) {
    const frame404 = generatePage404(code);
    return c.json(frame404, 404, {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Teletext-Bytes': String(frame404.bytes),
      'X-Teletext-Grid': '40x24',
    });
  }

  let frame: TeletextFrameResponse;

  switch (code) {
    case '100':
      frame = getIndexPage();
      break;

    case '102':
      frame = getBulletinPage();
      break;

    case '201':
      if (subpage === 2) {
        frame = await getWeatherPage();
      } else {
        frame = await getEarthquakePage();
      }
      break;

    case '301':
      frame = getTransitPage();
      break;

    case '401':
      frame = getEmergencyPage();
      break;

    case '999':
      frame = getDiagnosticsPage();
      break;

    default:
      frame = generatePage404(code);
      break;
  }

  // verify byte budget
  const budget = checkByteBudget(frame);
  frame.bytes = budget.bytes;

  const cacheControl =
    code === '201'
      ? 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
      : 'public, max-age=300, s-maxage=600';

  return c.json(frame, 200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheControl,
    'X-Teletext-Page': frame.code,
    'X-Teletext-Bytes': String(frame.bytes),
    'X-Teletext-Grid': '40x24',
  });
});

// fallback to static assets if running with cloudflare assets binding
app.all('*', async (c) => {
  if (c.env?.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('P100 Teletext Transmitter', 200);
});

export default app;
