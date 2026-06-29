import { createLookupMemoryCache } from "@/lib/lookupMemoryCache";
import type { SenatranNormalizedVehicle } from "@/lib/senatran/types";

const cache = createLookupMemoryCache<SenatranNormalizedVehicle>();

export function senatranCacheGet(key: string): SenatranNormalizedVehicle | null {
  return cache.get(key);
}

export function senatranCacheSet(key: string, value: SenatranNormalizedVehicle, ttlSeconds: number): void {
  cache.set(key, value, ttlSeconds);
}

/** Testes */
export function __clearSenatranCacheForTests(): void {
  cache.clear();
}
