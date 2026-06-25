const BLOCKED_SCHEME = /^\s*(javascript:|data:|file:|vbscript:)/i;

/** Validação P0 de URLs fornecidas por usuárioes (sem SSRF por IP neste ciclo). */
export function isSafeUserLinkUrl(raw: string): { ok: true } | { ok: false; message: string } {
  const s = raw.trim();
  if (s === "") return { ok: true };
  if (BLOCKED_SCHEME.test(s)) {
    return { ok: false, message: "Esquema de URL não permitido." };
  }
  try {
    new URL(s);
    return { ok: true };
  } catch {
    return { ok: false, message: "URL inválida." };
  }
}
