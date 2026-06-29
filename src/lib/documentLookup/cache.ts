import { createLookupMemoryCache } from "@/lib/lookupMemoryCache";
import type { DocumentLookupNormalized } from "@/lib/documentLookup/types";

const cache = createLookupMemoryCache<DocumentLookupNormalized>();

export function documentLookupCacheGet(key: string): DocumentLookupNormalized | null {
  return cache.get(key);
}

export function documentLookupCacheSet(
  key: string,
  value: DocumentLookupNormalized,
  ttlSeconds: number,
): void {
  cache.set(key, value, ttlSeconds);
}

export function __clearDocumentLookupCacheForTests(): void {
  cache.clear();
}
