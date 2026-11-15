// P100 Teletext Portal - Offline Crisis Service Worker
// Enables 100% air-gapped emergency broadcast operation

const CACHE_NAME = 'p100-teletext-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // handle api page requests: network first with cache fallback
  if (url.pathname.startsWith('/api/page/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          // return deterministic offline fallback json frame if not in cache
          return new Response(
            JSON.stringify({
              code: '404',
              subpage: 1,
              totalSubpages: 1,
              title: 'OFFLINE ARCHIVE',
              bytes: 840,
              source: 'fallback',
              rows: [
                [
                  { t: 'P404  ', c: 'yellow', b: 'blue', d: true },
                  { t: 'P100 TELETEXT CRISIS TRANSMITTER', c: 'white', b: 'blue' },
                  { t: 'OFFLINE ', c: 'yellow', b: 'blue' },
                ],
                [
                  { t: 'TRANSMITTER CARRIER STATUS: DISCONNECTED', c: 'red' },
                ],
                [
                  { t: 'GRID-DOWN AIR-GAPPED PROTOCOL ENGAGED', c: 'yellow' },
                ],
                [],
                [
                  { t: 'LOCAL RECEIVER IS OPERATING ON BROWSER CACHE.', c: 'white' },
                ],
                [
                  { t: 'PRESS [IDX] OR [ESC] TO ACCESS MASTER INDEX.', c: 'cyan' },
                ],
              ],
              fastext: {
                red: { code: '100', label: 'INDEX' },
                green: { code: '102', label: 'BULLETIN' },
                yellow: { code: '301', label: 'TRANSIT' },
                cyan: { code: '401', label: 'EMERGENCY' },
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'X-Teletext-Offline': '1',
              },
            },
          );
        }),
    );
    return;
  }

  // static assets: stale-while-revalidate or cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});
