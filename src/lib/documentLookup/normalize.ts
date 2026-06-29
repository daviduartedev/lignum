export function normalizeDocumentDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export type DocumentKind = "cpf" | "cnpj" | "invalid";

export function detectDocumentKind(digits: string): DocumentKind {
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return "invalid";
}

function checkDigit(base: string, weights: number[]): number {
  const sum = weights.reduce((acc, w, i) => acc + Number(base[i] ?? 0) * w, 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCNPJ(raw: string): boolean {
  const digits = normalizeDocumentDigits(raw);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = checkDigit(digits.slice(0, 12), w1);
  if (d1 !== Number(digits[12])) return false;
  const d2 = checkDigit(digits.slice(0, 13), w2);
  return d2 === Number(digits[13]);
}

export function documentCacheKey(digits: string): string {
  return `cnpj:${digits}`;
}

/** Chave segura para logs (últimos 4 dígitos). */
export function documentLogKey(digits: string): string {
  if (digits.length < 4) return "doc:***";
  return `cnpj:***${digits.slice(-4)}`;
}

export function composeAddress(parts: {
  street?: string;
  streetNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string | undefined {
  const chunks: string[] = [];
  const line1 = [parts.street, parts.streetNumber].filter(Boolean).join(", ");
  if (line1) chunks.push(line1);
  if (parts.addressComplement) chunks.push(parts.addressComplement);
  if (parts.neighborhood) chunks.push(parts.neighborhood);
  const cityLine = [parts.city, parts.state].filter(Boolean).join(" - ");
  if (cityLine) chunks.push(cityLine);
  if (parts.zipCode) chunks.push(`CEP ${parts.zipCode}`);
  const joined = chunks.join(" — ").trim();
  return joined || undefined;
}
