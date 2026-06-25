import type { SenatranNormalizedVehicle } from "@/lib/senatran/types";

type Entry = { expiresAt: number; value: SenatranNormalizedVehicle };

const store = new Map<string, Entry>();

export function senatranCacheGet(key: string): SenatranNormalizedVehicle | null {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return null;
  }
  return e.value;
}

export function senatranCacheSet(key: string, value: SenatranNormalizedVehicle, ttlSeconds: number): void {
  store.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, value });
}

/** Testes */
export function __clearSenatranCacheForTests(): void {
  store.clear();
}
