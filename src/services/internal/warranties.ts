import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToClient } from "@/lib/mappers/client";
import { mapApiRowToVehicle } from "@/lib/mappers/vehicle";
import { mapApiRowToWarranty } from "@/lib/mappers/warranty";
import type { Client, Vehicle, Warranty } from "@/types";

export async function fetchAllWarranties(): Promise<Warranty[]> {
  const [vRows, cRows] = await Promise.all([
    apiFetch<Record<string, unknown>[]>("/api/vehicles?all=1"),
    apiFetch<Record<string, unknown>[]>("/api/clients?all=1"),
  ]);
  const vehicles: Vehicle[] = vRows.map((r) => mapApiRowToVehicle(r));
  const clients: Client[] = cRows.map((r) => mapApiRowToClient(r));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/warranties?page=${page}&pageSize=100`,
  );
  return rows.map((r) => mapApiRowToWarranty(r, vehicleById, clientById));
}

export async function fetchWarrantiesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: Warranty[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/warranties?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status && opts.status !== "todos") url += `&status=${encodeURIComponent(opts.status)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  const vehicleIds = [...new Set(data.map((r) => Number(r.vehicleId)).filter(Number.isFinite))];
  const clientIds = [...new Set(data.map((r) => Number(r.clientId)).filter(Number.isFinite))];
  const [vRows, cRows] = await Promise.all([
    Promise.all(vehicleIds.map((id) => apiFetch<Record<string, unknown>>(`/api/vehicles/${id}`))),
    Promise.all(clientIds.map((id) => apiFetch<Record<string, unknown>>(`/api/clients/${id}`))),
  ]);
  const vehicles = vRows.map((r) => mapApiRowToVehicle(r));
  const clients = cRows.map((r) => mapApiRowToClient(r));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const items = data.map((r) => mapApiRowToWarranty(r, vehicleById, clientById));
  return { items, meta };
}

export async function fetchWarranty(routeId: string): Promise<Warranty> {
  const row = await apiFetch<Record<string, unknown>>(`/api/warranties/${encodeURIComponent(routeId)}`);
  const [vRow, cRow] = await Promise.all([
    apiFetch<Record<string, unknown>>(`/api/vehicles/${encodeURIComponent(String(row.vehicleId))}`),
    apiFetch<Record<string, unknown>>(`/api/clients/${encodeURIComponent(String(row.clientId))}`),
  ]);
  const veh = mapApiRowToVehicle(vRow);
  const cli = mapApiRowToClient(cRow);
  return mapApiRowToWarranty(row, new Map([[veh.id, veh]]), new Map([[cli.id, cli]]));
}

export async function createWarranty(body: Record<string, unknown>): Promise<Warranty> {
  const row = await apiFetch<Record<string, unknown>>("/api/warranties", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return fetchWarranty(String(row.id));
}

export async function updateWarranty(routeId: string, body: Record<string, unknown>): Promise<Warranty> {
  await apiFetch<Record<string, unknown>>(`/api/warranties/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return fetchWarranty(routeId);
}

export type WarrantySummary = {
  ativas: number;
  vencendo: number;
  expiradas: number;
  canceladas: number;
};

export async function fetchWarrantySummary(): Promise<WarrantySummary> {
  return apiFetch<WarrantySummary>("/api/warranties/summary");
}
