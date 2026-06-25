export type SenatranTelemetryEvent =
  | "senatran_consulta_iniciada"
  | "senatran_consulta_sucesso"
  | "senatran_consulta_erro"
  | "senatran_campo_sobrescrito_manualmente";

export function logSenatranEvent(
  event: SenatranTelemetryEvent,
  payload: Record<string, unknown>,
): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload });
  console.info(line);
}
