import { brasilApiLookup } from "@/lib/documentLookup/brasilApiProvider";
import { httpDocumentLookup } from "@/lib/documentLookup/httpProvider";
import { mockDocumentLookup } from "@/lib/documentLookup/mockProvider";
import type { DocumentLookupInput, DocumentLookupNormalized } from "@/lib/documentLookup/types";

export type DocumentLookupProviderName = "mock" | "brasilapi" | "http";

export function getDocumentLookupProvider(): DocumentLookupProviderName {
  const p = (process.env.DOCUMENT_LOOKUP_PROVIDER ?? "mock").toLowerCase();
  if (p === "brasilapi") return "brasilapi";
  if (p === "http") return "http";
  return "mock";
}

export async function runDocumentLookup(input: DocumentLookupInput): Promise<{
  normalized: DocumentLookupNormalized;
  rawForAudit: Record<string, unknown>;
  provider: DocumentLookupProviderName;
  unitCost: number;
}> {
  const provider = getDocumentLookupProvider();
  const unitCost =
    provider === "mock" ? 0 : Number(process.env.DOCUMENT_LOOKUP_UNIT_COST_BRL ?? "0") || 0;

  if (provider === "brasilapi") {
    const r = await brasilApiLookup(input);
    return { ...r, provider, unitCost };
  }
  if (provider === "http") {
    const r = await httpDocumentLookup(input);
    return { ...r, provider, unitCost };
  }

  const r = await mockDocumentLookup(input);
  return { ...r, provider, unitCost };
}
