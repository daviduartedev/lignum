type CacheEntry<T> = { expiresAt: number; value: T };

export function createLookupMemoryCache<T>() {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | null {
      const e = store.get(key);
      if (!e) return null;
      if (Date.now() > e.expiresAt) {
        store.delete(key);
        return null;
      }
      return e.value;
    },
    set(key: string, value: T, ttlSeconds: number): void {
      store.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, value });
    },
    clear(): void {
      store.clear();
    },
  };
}
