import { redactSensitive } from "@/lib/secureLogger";

export type DocumentLookupTelemetryEvent =
  | "document_lookup_iniciada"
  | "document_lookup_sucesso"
  | "document_lookup_erro";

export function logDocumentLookupEvent(
  event: DocumentLookupTelemetryEvent,
  payload: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...redactSensitive(payload) as Record<string, unknown>,
  });
  console.info(line);
}
