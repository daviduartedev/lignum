/** Limite de `Decimal(14, 2)` no Postgres (12 dígitos inteiros + 2 decimais). */
export const MAX_DECIMAL_14_2 = 999_999_999_999.99;

export function parseBRLMoney(input: string): number | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const normalized = hasComma ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;

  const n = Number(normalized);
  if (!Number.isFinite(n) || n > MAX_DECIMAL_14_2) return null;
  return n;
}
