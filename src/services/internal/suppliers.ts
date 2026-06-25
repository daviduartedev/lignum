import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToSupplier } from "@/lib/mappers/supplier";
import type { Supplier } from "@/types";

export async function fetchAllSuppliers(): Promise<Supplier[]> {
  const rows = await fetchAllPaginated<Record<string, unknown>>((page) => `/api/suppliers?page=${page}&pageSize=100`);
  return rows.map((r) => mapApiRowToSupplier(r));
}

export async function createSupplier(body: Record<string, unknown>): Promise<Supplier> {
  const row = await apiFetch<Record<string, unknown>>("/api/suppliers", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToSupplier(row);
}

export async function updateSupplier(routeId: string, body: Record<string, unknown>): Promise<Supplier> {
  const row = await apiFetch<Record<string, unknown>>(`/api/suppliers/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToSupplier(row);
}

export async function deleteSupplier(routeId: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/suppliers/${encodeURIComponent(routeId)}`, {
    method: "DELETE",
  });
}

export async function fetchSuppliersPage(
  page: number,
  opts?: { pageSize?: number; q?: string },
): Promise<{ suppliers: Supplier[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/suppliers?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { suppliers: data.map((r) => mapApiRowToSupplier(r)), meta };
}
