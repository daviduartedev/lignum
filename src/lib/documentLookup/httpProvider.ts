import { mapBrasilApiCnpjToNormalized, type BrasilApiCnpjPayload } from "@/lib/documentLookup/mapper";
import type { DocumentLookupInput, DocumentLookupProviderResult } from "@/lib/documentLookup/types";
import { DocumentLookupError } from "@/lib/documentLookup/errors";
import { normalizeDocumentDigits } from "@/lib/documentLookup/normalize";

const TIMEOUT_MS = Number(process.env.DOCUMENT_LOOKUP_HTTP_TIMEOUT_MS ?? "8000");

/**
 * Fallback HTTP genérico — URL base + /{cnpj} com JSON compatível BrasilAPI/ReceitaWS.
 * Configure `DOCUMENT_LOOKUP_HTTP_BASE` (ex.: https://www.receitaws.com.br/v1/cnpj).
 */
export async function httpDocumentLookup(input: DocumentLookupInput): Promise<DocumentLookupProviderResult> {
  const base = process.env.DOCUMENT_LOOKUP_HTTP_BASE?.trim();
  if (!base) {
    throw new DocumentLookupError("PROVIDER_ERROR", "Provedor HTTP não configurado.");
  }

  const digits = normalizeDocumentDigits(input.document);
  const url = `${base.replace(/\/$/, "")}/${digits}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = process.env.DOCUMENT_LOOKUP_HTTP_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });

    if (res.status === 404) {
      throw new DocumentLookupError("CNPJ_NOT_FOUND", "CNPJ não encontrado na base consultada.");
    }
    if (!res.ok) {
      throw new DocumentLookupError("PROVIDER_ERROR", "Falha ao consultar CNPJ. Tente novamente ou cadastre manualmente.");
    }

    const payload = (await res.json()) as BrasilApiCnpjPayload & { status?: string; message?: string };
    if (payload.status === "ERROR") {
      throw new DocumentLookupError("CNPJ_NOT_FOUND", payload.message ?? "CNPJ não encontrado.");
    }

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
