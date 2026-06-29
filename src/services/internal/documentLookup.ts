import { apiFetch } from "@/lib/apiClient";
import type { DocumentLookupNormalized } from "@/lib/documentLookup/types";

export type DocumentLookupResponse = DocumentLookupNormalized & {
  cached: boolean;
  provider: string;
  cost: number;
};

export async function documentLookup(body: {
  document: string;
  context?: "client" | "supplier";
}): Promise<DocumentLookupResponse> {
  return apiFetch<DocumentLookupResponse>("/api/document-lookup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type DocumentLookupUsageResponse = {
  monthTotal: string;
  currency: string;
  isDemo: boolean;
  provider: string;
};

export async function fetchDocumentLookupUsage(): Promise<DocumentLookupUsageResponse> {
  return apiFetch<DocumentLookupUsageResponse>("/api/document-lookup/usage");
}
