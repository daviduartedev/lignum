/**
 * Helpers de formatação para documentos PDF (cycle 0614).
 *
 * Mantidos locais ao módulo de PDF para que os templates fiquem
 * auto-contidos e não dependam de helpers de UI client-side.
 */

/** Formata um número/Decimal serializado como moeda BRL. */
export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? Number(n) : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(safe);
}

/** Formata uma data (Date | ISO string) no padrão dd/mm/aaaa. */
export function formatDateBR(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Texto por extenso aproximado da data (ex.: "17 de junho de 2026"). */
export function formatDateLong(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Valor seguro para campos de texto — devolve travessão quando vazio. */
export function orDash(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v ? v : "—";
}
