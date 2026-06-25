import type { ApiErrorCode } from "@/lib/apiErrors";
import { defaultMessageFor } from "@/lib/apiErrors";
import type { PaginationMeta } from "@/lib/pagination";
import { applySecurityHeaders } from "@/lib/securityHeaders";

export type ApiSuccessEnvelope<T> = { success: true; data: T; meta?: PaginationMeta };
export type ApiErrorEnvelope = {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: unknown; correlationId?: string };
};

function stringifyBody(body: unknown): string {
  return JSON.stringify(body, (_key, value) => {
    if (value !== null && typeof value === "object" && "toFixed" in value && typeof (value as { toFixed: () => string }).toFixed === "function") {
      return (value as { toString: () => string }).toString();
    }
    return value;
  });
}

/** Resposta JSON genérica (middleware, legado). */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  applySecurityHeaders(headers);

  return new Response(stringifyBody(data), {
    ...init,
    headers,
  });
}

export function ok<T>(data: T, init?: ResponseInit, meta?: PaginationMeta): Response {
  const body: ApiSuccessEnvelope<T> =
    meta !== undefined ? { success: true, data, meta } : { success: true, data };
  return jsonResponse(body, init);
}

export function fail(
  code: ApiErrorCode,
  status: number,
  options?: { message?: string; details?: unknown; correlationId?: string; headers?: HeadersInit },
): Response {
  const message = options?.message ?? defaultMessageFor(code);
  const errBody: ApiErrorEnvelope = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
      ...(options?.correlationId ? { correlationId: options.correlationId } : {}),
    },
  };
  return jsonResponse(errBody, { status, headers: options?.headers });
}
