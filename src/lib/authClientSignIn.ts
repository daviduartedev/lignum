"use client";

/**
 * Login credentials com parsing seguro da resposta Auth.js (redirect: false).
 * O `signIn` do next-auth/react faz `new URL(data.url)` e lança se `url` for relativa —
 * sintoma: HTTP 200 + "Não foi possível conectar" no UI.
 */
export type CredentialsSignInResult = {
  ok: boolean;
  status: number;
  error?: string;
  code?: string;
  url?: string | null;
};

export async function signInCredentials(options: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<CredentialsSignInResult> {
  const callbackUrl = options.callbackUrl ?? (typeof window !== "undefined" ? window.location.href : "/");

  const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = csrfJson.csrfToken ?? "";

  const body = new URLSearchParams({
    email: options.email,
    password: options.password,
    csrfToken,
    callbackUrl,
  });

  const res = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    credentials: "include",
    body,
  });

  let data: { url?: string };
  try {
    data = (await res.json()) as { url?: string };
  } catch {
    return { ok: false, status: res.status, error: "InvalidResponse" };
  }

  let error: string | undefined;
  let code: string | undefined;
  if (data.url) {
    try {
      const parsed = new URL(data.url, window.location.origin);
      error = parsed.searchParams.get("error") ?? undefined;
      code = parsed.searchParams.get("code") ?? undefined;
    } catch {
      return { ok: false, status: res.status, error: "InvalidCallbackUrl" };
    }
  }

  if (res.ok) {
    await fetch("/api/auth/session", { credentials: "include" });
  }

  return {
    ok: res.ok && !error,
    status: res.status,
    error,
    code,
    url: error ? null : data.url ?? null,
  };
}
