/** Converte strings `YYYY-MM-DD` ou ISO completas em `Date` (UTC seguro para datas só-dia). */
export function parseDateInput(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T00:00:00.000Z`);
  }
  return new Date(s);
}

export function parseOptionalDate(s: string | null | undefined): Date | null {
  if (s == null || s === "") {
    return null;
  }
  return parseDateInput(s);
}
