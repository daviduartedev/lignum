import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToContract } from "@/lib/mappers/contract";
import { fetchAllClients, fetchClient } from "@/services/internal/clients";
import { fetchVehicle } from "@/services/internal/vehicleCrud";
import { fetchAllVehicles } from "@/services/internal/vehicles";
import type { Contract } from "@/types";

export async function fetchAllContracts(): Promise<Contract[]> {
  const [vehicles, clients] = await Promise.all([fetchAllVehicles(), fetchAllClients()]);
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/contracts?page=${page}&pageSize=100`,
  );
  return rows.map((r) => mapApiRowToContract(r, vehicleById, clientById));
}

export async function fetchContractsPage(
  page: number,
  opts?: { pageSize?: number; q?: string },
): Promise<{ items: Contract[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/contracts?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  const vehicleIds = [...new Set(data.map((r) => Number(r.vehicleId)).filter(Number.isFinite))];
  const clientIds = [...new Set(data.map((r) => Number(r.clientId)).filter(Number.isFinite))];
  const [vehicles, clients] = await Promise.all([
    Promise.all(vehicleIds.map((id) => fetchVehicle(String(id)))),
    Promise.all(clientIds.map((id) => fetchClient(String(id)))),
  ]);
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const items = data.map((r) => mapApiRowToContract(r, vehicleById, clientById));
  return { items, meta };
}

export async function fetchContract(routeId: string): Promise<Contract> {
  const row = await apiFetch<Record<string, unknown>>(`/api/contracts/${encodeURIComponent(routeId)}`);
  const [vehicle, client] = await Promise.all([
    fetchVehicle(String(row.vehicleId)),
    fetchClient(String(row.clientId)),
  ]);
  return mapApiRowToContract(row, new Map([[vehicle.id, vehicle]]), new Map([[client.id, client]]));
}

export async function createContract(body: Record<string, unknown>): Promise<Contract> {
  const row = await apiFetch<Record<string, unknown>>("/api/contracts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const [vehicle, client] = await Promise.all([
    fetchVehicle(String(row.vehicleId)),
    fetchClient(String(row.clientId)),
  ]);
  return mapApiRowToContract(row, new Map([[vehicle.id, vehicle]]), new Map([[client.id, client]]));
}

export async function updateContract(routeId: string, body: Record<string, unknown>): Promise<Contract> {
  const row = await apiFetch<Record<string, unknown>>(`/api/contracts/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const [vehicle, client] = await Promise.all([
    fetchVehicle(String(row.vehicleId)),
    fetchClient(String(row.clientId)),
  ]);
  return mapApiRowToContract(row, new Map([[vehicle.id, vehicle]]), new Map([[client.id, client]]));
}
