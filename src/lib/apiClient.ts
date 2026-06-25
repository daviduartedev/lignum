import { ApiError, type ApiErrorCode } from "@/lib/apiErrors";
import { setAuthReturnPathCookie } from "@/lib/authReturnPath";
import type { PaginationMeta } from "@/lib/pagination";

type SuccessEnvelope<T> = { success: true; data: T; meta?: PaginationMeta };
type ErrorEnvelope = {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

function isEnvelope(v: unknown): v is SuccessEnvelope<unknown> | ErrorEnvelope {
  return typeof v === "object" && v !== null && "success" in v;
}

async function doFetch(input: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (
    method !== "GET" &&
    method !== "HEAD" &&
    init?.body != null &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await doFetch(input, init);
  const ct = res.headers.get("content-type");
  let parsed: unknown = null;
  if (ct?.includes("application/json")) {
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
  }

  if (isEnvelope(parsed)) {
    if (parsed.success) {
      return parsed.data as T;
    }
    const err = parsed.error;
    if (res.status === 401 || err.code === "UNAUTHENTICATED") {
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: false });
      if (typeof window !== "undefined") {
        const path = window.location.pathname + window.location.search;
        setAuthReturnPathCookie(path);
        window.location.assign("/login");
      }
    }
    throw new ApiError(err.code, err.message, res.status, err.details);
  }

  const text = parsed != null && typeof parsed === "object" ? JSON.stringify(parsed) : String(parsed ?? "");
  throw new ApiError("INTERNAL_ERROR", text || "Erro inesperado. Tente novamente.", res.status);
}

export async function apiFetchPaginated<T>(input: string, init?: RequestInit): Promise<{ data: T[]; meta: PaginationMeta }> {
  const res = await doFetch(input, init);
  const parsed = (await res.json()) as unknown;
  if (!isEnvelope(parsed) || !parsed.success) {
    if (isEnvelope(parsed) && !parsed.success) {
      const err = parsed.error;
      if (res.status === 401 || err.code === "UNAUTHENTICATED") {
        const { signOut } = await import("next-auth/react");
        await signOut({ redirect: false });
        if (typeof window !== "undefined") {
          const path = window.location.pathname + window.location.search;
          setAuthReturnPathCookie(path);
          window.location.assign("/login");
        }
      }
      throw new ApiError(parsed.error.code, parsed.error.message, res.status, parsed.error.details);
    }
    throw new ApiError("INTERNAL_ERROR", "Resposta de listagem inválida.", res.status);
  }
  const ok = parsed as SuccessEnvelope<T[]>;
  if (!ok.meta) {
    throw new ApiError("INTERNAL_ERROR", "Metadados de paginação em falta.", res.status);
  }
  return { data: ok.data, meta: ok.meta };
}

/** Percorre todas as páginas até `totalPages` (útil para agregações na UI). */
export async function fetchAllPaginated<T>(buildUrl: (page: number) => string): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const { data, meta } = await apiFetchPaginated<T>(buildUrl(page));
    out.push(...data);
    if (page >= meta.totalPages) break;
    page += 1;
  }
  return out;
}

