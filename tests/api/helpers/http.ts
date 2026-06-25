import { NextRequest } from "next/server";

export function apiUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, "http://test.local");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export function jsonRequest(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): NextRequest {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(apiUrl(path, query), init);
}

export async function parseEnvelope(res: Response) {
  return (await res.json()) as {
    success: boolean;
    data?: unknown;
    error?: { code: string; message: string };
    meta?: unknown;
  };
}

/** Contexto mínimo para handlers `withRole` nos testes de rota. */
export const testRouteCtx = { params: Promise.resolve({}) };
