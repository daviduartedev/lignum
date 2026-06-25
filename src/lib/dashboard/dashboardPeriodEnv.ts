/**
 * Lookback em meses civis (America/Sao_Paulo) para o ranking “Marcas mais vendidas”.
 * Só servidor, ver spec do painel.
 */
export function getDashboardTopBrandsMonths(): number {
  const raw = process.env.DASHBOARD_TOP_BRANDS_MONTHS;
  const n = raw != null && raw !== "" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 36) return 12;
  return n;
}

/**
 * Quantidade de meses no resumo “Vendas por mês” no painel.
 * Só servidor, ver spec do painel.
 */
export function getDashboardVendasResumoMonths(): number {
  const raw = process.env.DASHBOARD_VENDAS_RESUMO_MONTHS;
  const n = raw != null && raw !== "" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 24) return 6;
  return n;
}
