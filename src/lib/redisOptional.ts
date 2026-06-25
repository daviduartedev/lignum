import { Redis } from "@upstash/redis/cloudflare";

let warnedMissingRedis = false;
let cachedRedis: Redis | null | undefined;

export function getOptionalRedis(): Redis | null {
  if (cachedRedis !== undefined) {
    return cachedRedis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV !== "test" && !warnedMissingRedis) {
      warnedMissingRedis = true;
      console.warn(
        "[security] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN ausentes, rate-limit não persistente (memória). Configure Upstash em produção/preview.",
      );
    }
    cachedRedis = null;
    return null;
  }
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

/** Só para testes que precisam repor o cliente após mudar env. */
export function __resetOptionalRedisForTests(): void {
  cachedRedis = undefined;
}
