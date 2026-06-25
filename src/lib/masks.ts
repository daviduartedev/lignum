import { parseBRLMoney } from "./money";

export function maskCPF(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskCPFCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) return maskCPF(d);
  return maskCNPJ(d);
}

export function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (!d.length) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCEP(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskBRL(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 17);
  if (!d) return "";
  const n = Number(d) / 100;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numberToBRLMaskedFromReais(reais: number): string {
  if (!Number.isFinite(reais) || reais === 0) return "";
  const cents = Math.round(reais * 100);
  return maskBRL(String(cents));
}

export function maskIntegerReais(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 12);
  if (!d) return "";
  const n = parseInt(d, 10);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR");
}

export function parseIntegerReais(formatted: string): number | null {
  const d = formatted.replace(/\D/g, "");
  if (!d) return null;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : null;
}

export function maskKm(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 7);
  if (!d) return "";
  const n = parseInt(d, 10);
  return n.toLocaleString("pt-BR");
}

export function parseKm(formatted: string): number | null {
  const d = formatted.replace(/\D/g, "");
  if (!d) return null;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : null;
}

export function maskYear(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 4);
}

export function maskPlate(raw: string): string {
  const u = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (u.length <= 3) return u;
  return `${u.slice(0, 3)}-${u.slice(3)}`;
}

export function maskDecimal2(raw: string): string {
  const t = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const parts = t.split(".");
  const intPart = (parts[0] ?? "").replace(/\D/g, "");
  if (parts.length === 1) return intPart;
  const dec = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);
  return intPart + (parts.length > 1 ? "." + dec : "");
}

export function maskQty(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

/** Interpreta texto com vírgula decimal (UI) para número. */
export function parseDecimal2(formatted: string): number | null {
  const s = formatted.replace(",", ".").trim();
  if (!s || s === ".") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export { parseBRLMoney };
