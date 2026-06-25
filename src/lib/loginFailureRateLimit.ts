import { getOptionalRedis } from "@/lib/redisOptional";
import { checkLoginRateLimit, clearLoginFailures, recordLoginFailure } from "@/lib/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

/**
 * Limite de falhas de login (persistente com Redis / in-memory em dev).
 * Chave típica: `login:${ip}:${email}`.
 */
export async function checkLoginFailuresAllowed(key: string): Promise<{ allowed: boolean }> {
  const redis = getOptionalRedis();
  if (!redis) {
    return checkLoginRateLimit(key, LIMIT, WINDOW_MS);
  }
  const now = Date.now();
  const min = now - WINDOW_MS;
  const rk = `lf:${key}`;
  await redis.zremrangebyscore(rk, 0, min);
  const c = await redis.zcard(rk);
  return { allowed: c < LIMIT };
}

export async function recordLoginFailureRemote(key: string): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) {
    recordLoginFailure(key, WINDOW_MS);
    return;
  }
  const now = Date.now();
  const min = now - WINDOW_MS;
  const rk = `lf:${key}`;
  await redis.zremrangebyscore(rk, 0, min);
  await redis.zadd(rk, { score: now, member: `${now}:${Math.random().toString(36).slice(2)}` });
  await redis.expire(rk, Math.ceil(WINDOW_MS / 1000) + 60);
}

export async function clearLoginFailuresRemote(key: string): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) {
    clearLoginFailures(key);
    return;
  }
  await redis.del(`lf:${key}`);
}
