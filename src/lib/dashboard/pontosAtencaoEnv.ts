/**
 * Limiar mínimo de dias parado para alertas no painel e popup.
 * Variável só no servidor (ver spec do painel).
 */
export function getDashboardPontosAtencaoDiasMin(): number {
  const raw = process.env.DASHBOARD_PONTOS_ATENCAO_DIAS_MIN;
  const n = raw != null && raw !== "" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return 60;
  return n;
}
