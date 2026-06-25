/** `id` de rota → inteiro positivo ou `null` (inválido/ausente). */
export function parsePositiveInt(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
