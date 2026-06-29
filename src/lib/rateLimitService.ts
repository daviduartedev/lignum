import { Ratelimit } from "@upstash/ratelimit";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/clientIp";
import { fail } from "@/lib/jsonResponse";
import { getOptionalRedis } from "@/lib/redisOptional";
import { SlidingWindowMemory } from "@/lib/slidingWindowMemory";

const memSenatranUser = new SlidingWindowMemory(60 * 1000);
const memSenatranResource = new SlidingWindowMemory(60 * 1000);
const memDocumentLookupUser = new SlidingWindowMemory(60 * 1000);
const memDocumentLookupResource = new SlidingWindowMemory(60 * 1000);

let rlSenatranUser: Ratelimit | null | undefined;
let rlSenatranResource: Ratelimit | null | undefined;
let rlDocumentLookupUser: Ratelimit | null | undefined;
let rlDocumentLookupResource: Ratelimit | null | undefined;

function senatranUserLimiter(): Ratelimit | null {
  if (rlSenatranUser !== undefined) return rlSenatranUser;
  const redis = getOptionalRedis();
  if (!redis) {
    rlSenatranUser = null;
    return null;
  }
  rlSenatranUser = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:senatran:user",
  });
  return rlSenatranUser;
}

/** 1 consulta / minuto por placa ou chave de recurso (ex.: RENAVAM). */
function senatranResourceLimiter(): Ratelimit | null {
  if (rlSenatranResource !== undefined) return rlSenatranResource;
  const redis = getOptionalRedis();
  if (!redis) {
    rlSenatranResource = null;
    return null;
  }
  rlSenatranResource = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "1 m"),
    prefix: "rl:senatran:res",
  });
  return rlSenatranResource;
}

const memRegister = new SlidingWindowMemory(10 * 60 * 1000);
const memPost = new SlidingWindowMemory(60 * 1000);
const memGetAll = new SlidingWindowMemory(60 * 1000);

let rlRegister: Ratelimit | null | undefined;
let rlPost: Ratelimit | null | undefined;
let rlGetAll: Ratelimit | null | undefined;

function registerLimiter(): Ratelimit | null {
  if (rlRegister !== undefined) return rlRegister;
  const redis = getOptionalRedis();
  if (!redis) {
    rlRegister = null;
    return null;
  }
  rlRegister = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:register",
  });
  return rlRegister;
}

function postLimiter(): Ratelimit | null {
  if (rlPost !== undefined) return rlPost;
  const redis = getOptionalRedis();
  if (!redis) {
    rlPost = null;
    return null;
  }
  rlPost = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:post",
  });
  return rlPost;
}

function getAllLimiter(): Ratelimit | null {
  if (rlGetAll !== undefined) return rlGetAll;
  const redis = getOptionalRedis();
  if (!redis) {
    rlGetAll = null;
    return null;
  }
  rlGetAll = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:getall",
  });
  return rlGetAll;
}

function rateLimitedResponse(retryAfterSeconds = 60): Response {
  return fail("RATE_LIMITED", 429, {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

/** Desliga limites em suites locais (ex.: Playwright com `webServer.env`). */
function isRateLimitDisabled(): boolean {
  const v = process.env.RATE_LIMIT_DISABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** `POST /api/auth/register`, 5 / 10 min por IP. */
export async function assertRegisterPostRateLimit(req: NextRequest): Promise<Response | null> {
  if (isRateLimitDisabled()) return null;
  const ip = getClientIp(req);
  const key = `ip:${ip}`;
  const limiter = registerLimiter();
  if (limiter) {
    const { success } = await limiter.limit(key);
    if (!success) return rateLimitedResponse();
    return null;
  }
  const { allowed } = memRegister.hit(`register:${key}`, 5);
  if (!allowed) return rateLimitedResponse();
  return null;
}

/** `POST` em `/api/*` fora de `/api/auth/*`, 30 / min por IP+rota. */
export async function assertApiPostRateLimit(req: NextRequest): Promise<Response | null> {
  if (isRateLimitDisabled()) return null;
  const ip = getClientIp(req);
  const pathname = req.nextUrl.pathname;
  const key = `${ip}:${pathname}`;
  const limiter = postLimiter();
  if (limiter) {
    const { success } = await limiter.limit(key);
    if (!success) return rateLimitedResponse();
    return null;
  }
  const { allowed } = memPost.hit(`post:${key}`, 30);
  if (!allowed) return rateLimitedResponse();
  return null;
}

/** `GET` com `?all=1`, 10 / min por IP + id de usuário. */
export async function assertGetAllQueryRateLimit(
  req: NextRequest,
  userId: string | undefined,
): Promise<Response | null> {
  if (isRateLimitDisabled()) return null;
  if (!userId) {
    return fail("UNAUTHENTICATED", 401);
  }
  const ip = getClientIp(req);
  const key = `${ip}:u:${userId}`;
  const limiter = getAllLimiter();
  if (limiter) {
    const { success } = await limiter.limit(key);
    if (!success) return rateLimitedResponse();
    return null;
  }
  const { allowed } = memGetAll.hit(`getall:${key}`, 10);
  if (!allowed) return rateLimitedResponse();
  return null;
}

const MAX_BODY_BYTES = 1024 * 1024;

export function assertBodySizeLimit(req: NextRequest): Response | null {
  const cl = req.headers.get("content-length");
  if (!cl) return null;
  const n = Number.parseInt(cl, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > MAX_BODY_BYTES) {
    return fail("BAD_REQUEST", 400, { message: "Corpo da requisição demasiado grande." });
  }
  return null;
}

export const API_BODY_SIZE_LIMIT_BYTES = MAX_BODY_BYTES;

/** Limpa estado in-memory e recria limitadores Upstash (testes). */
export function __resetRateLimitStateForTests(): void {
  memRegister.clear();
  memPost.clear();
  memGetAll.clear();
  memSenatranUser.clear();
  memSenatranResource.clear();
  memDocumentLookupUser.clear();
  memDocumentLookupResource.clear();
  rlRegister = rlPost = rlGetAll = undefined;
  rlSenatranUser = rlSenatranResource = undefined;
  rlDocumentLookupUser = rlDocumentLookupResource = undefined;
}

/**
 * Consulta SENATRAN: 5 req/min por usuário e 1 req/min por placa/RENAVAM (chave `resourceKey`).
 */
export async function assertSenatranLookupRateLimit(
  req: NextRequest,
  userId: string,
  resourceKey: string,
): Promise<Response | null> {
  if (isRateLimitDisabled()) return null;
  const uLim = senatranUserLimiter();
  const userKey = userId;
  if (uLim) {
    const { success } = await uLim.limit(userKey);
    if (!success) return rateLimitedResponse();
  } else if (!memSenatranUser.hit(`senatran:user:${userKey}`, 5).allowed) {
    return rateLimitedResponse();
  }

  const rLim = senatranResourceLimiter();
  const resKey = resourceKey.slice(0, 200);
  if (rLim) {
    const { success } = await rLim.limit(resKey);
    if (!success) return rateLimitedResponse();
  } else if (!memSenatranResource.hit(`senatran:res:${resKey}`, 1).allowed) {
    return rateLimitedResponse();
  }

  return null;
}

function documentLookupUserLimiter(): Ratelimit | null {
  if (rlDocumentLookupUser !== undefined) return rlDocumentLookupUser;
  const redis = getOptionalRedis();
  if (!redis) {
    rlDocumentLookupUser = null;
    return null;
  }
  rlDocumentLookupUser = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "rl:doclookup:user",
  });
  return rlDocumentLookupUser;
}

function documentLookupResourceLimiter(): Ratelimit | null {
  if (rlDocumentLookupResource !== undefined) return rlDocumentLookupResource;
  const redis = getOptionalRedis();
  if (!redis) {
    rlDocumentLookupResource = null;
    return null;
  }
  rlDocumentLookupResource = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "1 m"),
    prefix: "rl:doclookup:res",
  });
  return rlDocumentLookupResource;
}

/** Consulta cadastral CNPJ: 5 req/min por usuário e 1 req/min por documento. */
export async function assertDocumentLookupRateLimit(
  req: NextRequest,
  userId: string,
  resourceKey: string,
): Promise<Response | null> {
  if (isRateLimitDisabled()) return null;

  const uLim = documentLookupUserLimiter();
  if (uLim) {
    const { success } = await uLim.limit(userId);
    if (!success) return rateLimitedResponse();
  } else if (!memDocumentLookupUser.hit(`doclookup:user:${userId}`, 5).allowed) {
    return rateLimitedResponse();
  }

  const rLim = documentLookupResourceLimiter();
  const resKey = resourceKey.slice(0, 200);
  if (rLim) {
    const { success } = await rLim.limit(resKey);
    if (!success) return rateLimitedResponse();
  } else if (!memDocumentLookupResource.hit(`doclookup:res:${resKey}`, 1).allowed) {
    return rateLimitedResponse();
  }

  return null;
}
