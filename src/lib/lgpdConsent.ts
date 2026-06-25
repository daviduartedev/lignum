/**
 * Consentimento LGPD, registro local; endpoint dedicado pode ser acrescentado depois.
 */

export const LGPD_PRIVACY_ACCEPTED_KEY = "lgpd_privacy_accepted_v1";
export const LGPD_SESSION_ID_KEY = "lgpd_session_id";

export const DEFAULT_PRIVACY_POLICY_VERSION =
  process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION?.trim() || "1.0";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(LGPD_SESSION_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(LGPD_SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

/** Após login bem-sucedido (cadastro ou credenciais). */
export async function recordPrivacyConsentAccepted(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LGPD_PRIVACY_ACCEPTED_KEY, "true");
  } catch {
    /* storage indisponível */
  }
}
