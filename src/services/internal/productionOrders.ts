import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToProductionOrder, type ProductionOrderDto } from "@/lib/mappers/productionOrder";

export async function fetchProductionOrdersPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: ProductionOrderDto[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/production-orders?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status) url += `&status=${encodeURIComponent(opts.status)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToProductionOrder(r)), meta };
}

export async function fetchAllProductionOrders(status?: string): Promise<ProductionOrderDto[]> {
  let url = "/api/production-orders?all=1";
  if (status) url += `&status=${encodeURIComponent(status)}`;
  const rows = await apiFetch<Record<string, unknown>[]>(url);
  return rows.map((r) => mapApiRowToProductionOrder(r));
}

export async function fetchProductionOrder(routeId: string): Promise<ProductionOrderDto> {
  const row = await apiFetch<Record<string, unknown>>(
    `/api/production-orders/${encodeURIComponent(routeId)}`,
  );
  return mapApiRowToProductionOrder(row);
}

export async function updateProductionOrder(
  routeId: string,
  body: Record<string, unknown>,
): Promise<ProductionOrderDto> {
  const row = await apiFetch<Record<string, unknown>>(
    `/api/production-orders/${encodeURIComponent(routeId)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
  return mapApiRowToProductionOrder(row);
}

export async function startProductionOrder(routeId: string): Promise<ProductionOrderDto> {
  const row = await apiFetch<Record<string, unknown>>(
    `/api/production-orders/${encodeURIComponent(routeId)}/start`,
    { method: "POST" },
  );
  return mapApiRowToProductionOrder(row);
}

export async function completeProductionOrder(routeId: string): Promise<ProductionOrderDto> {
  const row = await apiFetch<Record<string, unknown>>(
    `/api/production-orders/${encodeURIComponent(routeId)}/complete`,
    { method: "POST" },
  );
  return mapApiRowToProductionOrder(row);
}

export async function cancelProductionOrder(routeId: string): Promise<ProductionOrderDto> {
  const row = await apiFetch<Record<string, unknown>>(
    `/api/production-orders/${encodeURIComponent(routeId)}/cancel`,
    { method: "POST" },
  );
  return mapApiRowToProductionOrder(row);
}

/** Contagens por status para KPIs do kanban. */
export async function fetchProductionOrderStatusCounts(): Promise<Record<string, number>> {
  const rows = await fetchAllProductionOrders();
  const counts: Record<string, number> = {
    aguardando: 0,
    andamento: 0,
    concluida: 0,
    cancelada: 0,
    total: rows.length,
  };
  for (const row of rows) {
    counts[row.status] += 1;
  }
  return counts;
}
