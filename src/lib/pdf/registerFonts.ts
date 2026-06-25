/**
 * Registro de fontes para os documentos PDF (cycle 0614).
 *
 * Decisão (Stage 1): usar as fontes Type1 embutidas no PDF (Helvetica),
 * que o `@react-pdf/renderer` resolve sem baixar arquivos externos. Isto
 * mantém o build serverless (Vercel) determinístico — sem `fetch` de fontes
 * em runtime nem assets binários no bundle.
 *
 * Se no futuro precisarmos de uma fonte custom (ex.: identidade visual da
 * loja), registrar aqui via `Font.register({ family, src })` apontando para
 * um arquivo em `public/fonts/` empacotado no build.
 */

/** Família base usada em todos os templates. */
export const BASE_FONT_FAMILY = "Helvetica";
export const BASE_FONT_FAMILY_BOLD = "Helvetica-Bold";

/**
 * Ponto único de inicialização de fontes. Hoje é no-op (Helvetica é nativa),
 * mas os templates chamam mesmo assim para centralizar a futura configuração.
 */
export function ensureFontsRegistered(): void {
  // Sem fontes externas neste ciclo — Helvetica/Helvetica-Bold são nativas.
}
