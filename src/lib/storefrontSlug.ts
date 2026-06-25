/** Normaliza o subdomínio da vitrine (letras minúsculas, hífen). */
export function normalizeStoreSubdomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
