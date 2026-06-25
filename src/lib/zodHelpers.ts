import { z } from "zod";

/** Bloqueia fragmentos que parecem tags HTML (texto simples apenas). */
const MARKUP = /<\/?[a-zA-Z!]/;

export function zTextNoHtml(max: number) {
  return z
    .string()
    .max(max)
    .refine((s) => !MARKUP.test(s), { message: "HTML não é permitido neste campo." });
}

/** Título ou nome curto (mínimo 1). */
export function zTitleNoHtml(max: number) {
  return z
    .string()
    .min(1)
    .max(max)
    .refine((s) => !MARKUP.test(s), { message: "HTML não é permitido neste campo." });
}

export function zTextNoHtmlBounded(max: number) {
  return z.string().max(max).refine((s) => !MARKUP.test(s), { message: "HTML não é permitido neste campo." });
}

export function zTextNoHtmlOptional(max: number) {
  return z
    .string()
    .max(max)
    .optional()
    .refine((s) => s === undefined || s === "" || !MARKUP.test(s), { message: "HTML não é permitido neste campo." });
}

const BLOCKED_URL_SCHEME = /^\s*(javascript:|data:|file:|vbscript:)/i;

function isSafeHttpUrl(u: string): boolean {
  return !BLOCKED_URL_SCHEME.test(u.trim());
}

/** URL HTTP(S) sem esquemas perigosos (P0). */
export function zSafeHttpUrl() {
  return z.string().url().refine(isSafeHttpUrl, { message: "Esquema de URL não permitido." });
}

export function zSafeHttpUrlOptional() {
  return zSafeHttpUrl().optional();
}

/** URL ou string vazia (campos opcionais no formulário). */
export function zSafeHttpUrlOrEmpty() {
  return z.union([z.literal(""), zSafeHttpUrl()]);
}

export function zSafeHttpUrlArrayOptional() {
  return z
    .array(z.string().url().refine(isSafeHttpUrl, { message: "Esquema de URL não permitido." }))
    .optional();
}
