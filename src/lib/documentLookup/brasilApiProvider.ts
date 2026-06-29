import { mapBrasilApiCnpjToNormalized, type BrasilApiCnpjPayload } from "@/lib/documentLookup/mapper";
import type { DocumentLookupInput, DocumentLookupProviderResult } from "@/lib/documentLookup/types";
import { DocumentLookupError } from "@/lib/documentLookup/errors";
import { normalizeDocumentDigits } from "@/lib/documentLookup/normalize";

const TIMEOUT_MS = Number(process.env.DOCUMENT_LOOKUP_HTTP_TIMEOUT_MS ?? "8000");

export async function brasilApiLookup(input: DocumentLookupInput): Promise<DocumentLookupProviderResult> {
  const digits = normalizeDocumentDigits(input.document);
  const base = (process.env.DOCUMENT_LOOKUP_BRASILAPI_BASE ?? "https://brasilapi.com.br/api/cnpj/v1").replace(
    /\/$/,
    "",
  );
  const url = `${base}/${digits}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (res.status === 404) {
      throw new DocumentLookupError("CNPJ_NOT_FOUND", "CNPJ não encontrado na base consultada.");
    }
    if (!res.ok) {
      throw new DocumentLookupError("PROVIDER_ERROR", "Falha ao consultar CNPJ. Tente novamente ou cadastre manualmente.");
    }

    const payload = (await res.json()) as BrasilApiCnpjPayload;
    return {
      normalized: mapBrasilApiCnpjToNormalized(payload),
      rawForAudit: payload as Record<string, unknown>,
    };
  } catch (e: unknown) {
    if (e instanceof DocumentLookupError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new DocumentLookupError("PROVIDER_TIMEOUT", "Consulta excedeu o tempo limite.");
    }
    throw new DocumentLookupError("PROVIDER_ERROR", "Falha ao consultar CNPJ. Tente novamente ou cadastre manualmente.");
  } finally {
    clearTimeout(timer);
  }
}
