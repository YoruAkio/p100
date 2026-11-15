// edge-compatible ttl cache helper with cloudflare cache api & in-memory fallback

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number,
): Promise<{ data: T; cached: boolean }> {
  const now = Date.now();
  const memoryEntry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (memoryEntry && memoryEntry.expires > now) {
    return { data: memoryEntry.data, cached: true };
  }

  // try cloudflare cache api if available in worker environment
  const cfCache =
    typeof caches !== 'undefined' &&
    (caches as unknown as { default?: Cache }).default;
  const cacheUrl = `https://p100-cache.internal/${encodeURIComponent(key)}`;

  if (cfCache) {
    try {
      const match = await cfCache.match(cacheUrl);
      if (match) {
        const json = (await match.json()) as T;
        memoryStore.set(key, { data: json, expires: now + ttlSeconds * 1000 });
        return { data: json, cached: true };
      }
    } catch {
      // cache match failed, proceed to fetcher
    }
  }

  const freshData = await fetcher();
  memoryStore.set(key, { data: freshData, expires: now + ttlSeconds * 1000 });

  if (cfCache) {
    try {
      const resp = new Response(JSON.stringify(freshData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttlSeconds}`,
        },
      });
      await cfCache.put(cacheUrl, resp);
    } catch {
      // ignore cache write failures
    }
  }

  return { data: freshData, cached: false };
}
