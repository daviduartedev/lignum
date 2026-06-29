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
  const url = apiUrl(path, query);
  if (body !== undefined) {
    return new NextRequest(url, {
      method,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }
  return new NextRequest(url, { method });
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
