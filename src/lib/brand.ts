/**
 * Única origem da marca Lignum Gestão.
 * Substituir o PNG em `public/` mantém UI e favicon alinhados.
 *
 * Identidade (ver ID VISUAL - ALACRUZ / spec/design-system.md):
 *   Azul Royal #0234C9 · Azul Claro #046CEB · Preto #000000 · Branco #FFFFFF.
 */
export const BRAND_NAME = "Lignum Gestão";
export const BRAND_SHORT = "Lignum";
export const BRAND_TAGLINE = "Gestão para fábricas de carrocerias de madeira";
export const BRAND_LOGO_SRC = "/lignum-logo.png";

/**
 * `true` somente após adicionar `public/lignum-logo.png` (PNG válido).
 * Enquanto `false`, `BrandLogo` usa lockup textual — evita pedidos a um PNG inexistente.
 */
export const BRAND_LOGO_USE_IMAGE = false;

/** Cores da marca para uso fora do CSS (ex.: PDF, e-mail, gráficos server-side). */
export const BRAND_COLORS = {
  primary: "#0234C9", // Azul Royal
  accent: "#046CEB", // Azul Claro
  dark: "#000000",
  background: "#FFFFFF",
} as const;
