import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToClient } from "@/lib/mappers/client";
import type { Client } from "@/types";

export async function fetchClient(routeId: string): Promise<Client> {
  const row = await apiFetch<Record<string, unknown>>(`/api/clients/${encodeURIComponent(routeId)}`);
  return mapApiRowToClient(row);
}

export async function createClient(body: Record<string, unknown>): Promise<Client> {
  const row = await apiFetch<Record<string, unknown>>("/api/clients", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToClient(row);
}

export async function updateClient(routeId: string, body: Record<string, unknown>): Promise<Client> {
  const row = await apiFetch<Record<string, unknown>>(`/api/clients/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToClient(row);
}

export async function deleteClient(routeId: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/clients/${encodeURIComponent(routeId)}`, {
    method: "DELETE",
  });
}

export async function fetchAllClients(): Promise<Client[]> {
  const rows = await apiFetch<Record<string, unknown>[]>("/api/clients?all=1");
  return rows.map(mapApiRowToClient);
}

export async function fetchClientsPage(
  page: number,
  opts?: { pageSize?: number; q?: string },
): Promise<{ clients: Client[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/clients?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { clients: data.map(mapApiRowToClient), meta };
}
