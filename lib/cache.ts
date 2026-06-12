type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const sessionCache = new Map<string, CacheEntry<unknown>>();

function now() {
  return Date.now();
}

export function getCache<T>(key: string): T | null {
  const entry = sessionCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    sessionCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = 10 * 60 * 1000) {
  sessionCache.set(key, {
    value,
    expiresAt: now() + ttlMs
  });
}

export function clearExpiredCache() {
  const current = now();
  for (const [key, entry] of sessionCache.entries()) {
    if (entry.expiresAt <= current) {
      sessionCache.delete(key);
    }
  }
}
