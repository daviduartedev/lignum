import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import type { PaginationMeta } from "@/lib/pagination";

export type ClientDocumentRow = {
  id: number;
  title: string;
  notes?: string | null;
  externalUrl?: string | null;
  documentFileUrl?: string | null;
  clientId: number;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): ClientDocumentRow {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    notes: row.notes != null ? String(row.notes) : null,
    externalUrl: row.externalUrl != null ? String(row.externalUrl) : null,
    documentFileUrl: row.documentFileUrl != null ? String(row.documentFileUrl) : null,
    clientId: Number(row.clientId),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt ?? new Date().toISOString()),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt ?? new Date().toISOString()),
  };
}

export async function fetchClientDocumentsPage(
  clientId: number,
  page = 1,
  pageSize = 20,
): Promise<{ documents: ClientDocumentRow[]; meta: PaginationMeta }> {
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(
    `/api/client-documents?clientId=${clientId}&page=${page}&pageSize=${pageSize}`,
  );
  return { documents: data.map(mapRow), meta };
}

export async function createClientDocument(body: {
  title: string;
  clientId: number;
  notes?: string;
  externalUrl?: string;
  documentFileUrl?: string;
}): Promise<ClientDocumentRow> {
  const row = await apiFetch<Record<string, unknown>>("/api/client-documents", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapRow(row);
}

export async function deleteClientDocument(id: number): Promise<void> {
  await apiFetch<{ id: number }>(`/api/client-documents/${id}`, { method: "DELETE" });
}
