import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToServiceOrder } from "@/lib/mappers/serviceOrder";
import { fetchVehicle } from "@/services/internal/vehicleCrud";
import { fetchAllVehicles } from "@/services/internal/vehicles";
import type { ServiceOrder, Vehicle } from "@/types";

export async function fetchAllServiceOrders(): Promise<ServiceOrder[]> {
  const vehicles = await fetchAllVehicles();
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/service-orders?page=${page}&pageSize=100`,
  );
  return rows.map((r) => mapApiRowToServiceOrder(r, vehicleById));
}

export async function fetchServiceOrdersPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: ServiceOrder[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/service-orders?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status && opts.status !== "todos") url += `&status=${encodeURIComponent(opts.status)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  const vehicleIds = [...new Set(data.map((r) => Number(r.vehicleId)).filter(Number.isFinite))];
  const vehicles = await Promise.all(vehicleIds.map((id) => fetchVehicle(String(id))));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const items = data.map((r) => mapApiRowToServiceOrder(r, vehicleById));
  return { items, meta };
}

export async function fetchServiceOrder(routeId: string): Promise<ServiceOrder> {
  const row = await apiFetch<Record<string, unknown>>(`/api/service-orders/${encodeURIComponent(routeId)}`);
  const vehicle = await fetchVehicle(String(row.vehicleId));
  const vehicleById = new Map<number, Vehicle>([[vehicle.id, vehicle]]);
  return mapApiRowToServiceOrder(row, vehicleById);
}

export async function createServiceOrder(body: Record<string, unknown>): Promise<ServiceOrder> {
  const row = await apiFetch<Record<string, unknown>>("/api/service-orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const vehicle = await fetchVehicle(String(row.vehicleId));
  return mapApiRowToServiceOrder(row, new Map([[vehicle.id, vehicle]]));
}

export async function updateServiceOrder(routeId: string, body: Record<string, unknown>): Promise<ServiceOrder> {
  const row = await apiFetch<Record<string, unknown>>(`/api/service-orders/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const vehicle = await fetchVehicle(String(row.vehicleId));
  return mapApiRowToServiceOrder(row, new Map([[vehicle.id, vehicle]]));
}
