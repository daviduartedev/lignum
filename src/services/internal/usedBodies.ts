import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToUsedBody, type UsedBodyDto } from "@/lib/mappers/usedBody";

export async function fetchUsedBodiesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: UsedBodyDto[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/used-bodies?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status) url += `&status=${encodeURIComponent(opts.status)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToUsedBody(r)), meta };
}

export async function fetchAllUsedBodies(status?: string): Promise<UsedBodyDto[]> {
  let url = "/api/used-bodies?all=1";
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const rows = await apiFetch<Record<string, unknown>[]>(url);
  return rows.map((r) => mapApiRowToUsedBody(r));
}

export async function fetchUsedBody(routeId: string): Promise<UsedBodyDto & { statusHistory?: unknown[] }> {
  const row = await apiFetch<Record<string, unknown>>(`/api/used-bodies/${encodeURIComponent(routeId)}`);
  return mapApiRowToUsedBody(row) as UsedBodyDto & { statusHistory?: unknown[] };
}

export async function createUsedBody(body: Record<string, unknown>): Promise<UsedBodyDto> {
  const row = await apiFetch<Record<string, unknown>>("/api/used-bodies", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToUsedBody(row);
}

export async function updateUsedBody(routeId: string, body: Record<string, unknown>): Promise<UsedBodyDto> {
  const row = await apiFetch<Record<string, unknown>>(`/api/used-bodies/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToUsedBody(row);
}

export async function deleteUsedBody(routeId: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/used-bodies/${encodeURIComponent(routeId)}`, {
    method: "DELETE",
  });
}

/** KPI counts por status (até 500 registos). */
export async function fetchUsedBodyStatusCounts(): Promise<Record<string, number>> {
  const rows = await fetchAllPaginated<Record<string, unknown>>((page) =>
    `/api/used-bodies?page=${page}&pageSize=100`,
  );
  const counts: Record<string, number> = {
    disponivel: 0,
    reservada: 0,
    vendida: 0,
    em_reforma: 0,
    total: rows.length,
  };
  for (const row of rows) {
    const status = String(row.status ?? "");
    if (status in counts && status !== "total") counts[status] += 1;
  }
  return counts;
}
