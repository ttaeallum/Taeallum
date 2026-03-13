/**
 * In-process LRU-style TTL cache
 * No external dependencies — safe for single-process and cluster workers (each worker has own cache).
 * Routes that need caching: GET /api/courses, GET /api/courses/categories, GET /api/courses/featured
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet(key: string): any | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key: string, data: any, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheClear(): void {
  store.clear();
}

/** Express middleware: cache a GET route for ttlSeconds */
export function withCache(ttlSeconds: number) {
  return (req: any, res: any, next: any) => {
    const key = req.originalUrl;
    const cached = cacheGet(key);
    if (cached !== null) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }
    // Wrap res.json to intercept and store response
    const origJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200) cacheSet(key, body, ttlSeconds);
      res.setHeader("X-Cache", "MISS");
      return origJson(body);
    };
    next();
  };
}
