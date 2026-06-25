/** Cookie com o caminho interno para voltar após login (URL `/login` sem query). */
export const AUTH_RETURN_PATH_COOKIE = "lignum_auth_return";

const MAX_PATH_LEN = 1024;

/**
 * Aceita apenas caminhos relativos do mesmo site (evita open redirect).
 */
export function sanitizeAuthReturnPath(raw: string): string | null {
  const t = raw.trim();
  if (t.length === 0 || t.length > MAX_PATH_LEN) return null;
  if (!t.startsWith("/")) return null;
  if (t.startsWith("//")) return null;
  if (t.includes("\0") || t.includes("\n") || t.includes("\r")) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith("/javascript:") || lower.startsWith("/data:")) return null;
  return t;
}

export function returnPathFromNextUrl(pathname: string, search: string): string | null {
  return sanitizeAuthReturnPath(`${pathname}${search}`);
}

export function cookieValueForReturnPath(path: string): string {
  return encodeURIComponent(path);
}

export function setAuthReturnPathCookie(pathnameWithSearch: string): void {
  if (typeof document === "undefined") return;
  const safe = sanitizeAuthReturnPath(pathnameWithSearch);
  if (!safe) return;
  const enc = encodeURIComponent(safe);
  const isHttps = window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `${AUTH_RETURN_PATH_COOKIE}=${enc}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

/** Lê o cookie, valida, remove-o e devolve o caminho ou null. */
export function takeAuthReturnPathCookie(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== AUTH_RETURN_PATH_COOKIE) continue;
    const rawVal = part.slice(idx + 1).trim();
    clearAuthReturnPathCookie();
    try {
      return sanitizeAuthReturnPath(decodeURIComponent(rawVal));
    } catch {
      return null;
    }
  }
  return null;
}

export function clearAuthReturnPathCookie(): void {
  if (typeof document === "undefined") return;
  const isHttps = window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `${AUTH_RETURN_PATH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
