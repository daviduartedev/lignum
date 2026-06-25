/** Remove hífen/espaços; uppercase. */
export function normalizePlate(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
const OLD_BR = /^[A-Z]{3}\d{4}$/;

export function isValidBrazilPlate(normalized: string): boolean {
  if (normalized.length !== 7) return false;
  return MERCOSUL.test(normalized) || OLD_BR.test(normalized);
}

/** VIN, 17 caracteres sem I, O, Q. */
export function isValidChassis(v: string): boolean {
  const s = v.trim().toUpperCase();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(s);
}

export function normalizeRenavamDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}
