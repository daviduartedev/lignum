import { apiFetch, fetchAllPaginated } from "@/lib/apiClient";
import { mapApiRowToClient } from "@/lib/mappers/client";
import { mapApiRowToSale } from "@/lib/mappers/sale";
import { mapApiRowToVehicle } from "@/lib/mappers/vehicle";
import { fetchVehicle } from "@/services/internal/vehicleCrud";
import type { Client, Sale, Vehicle } from "@/types";

/** Vendas com veículo/cliente ligados (necessário para o Painel / margem). */
export async function fetchAllSales(): Promise<Sale[]> {
  const [vRows, cRows] = await Promise.all([
    apiFetch<Record<string, unknown>[]>("/api/vehicles?all=1"),
    apiFetch<Record<string, unknown>[]>("/api/clients?all=1"),
  ]);
  const vehicles: Vehicle[] = vRows.map((r) => mapApiRowToVehicle(r));
  const clients: Client[] = cRows.map((r) => mapApiRowToClient(r));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const rows = await fetchAllPaginated<Record<string, unknown>>((page) => `/api/sales?page=${page}&pageSize=100`);
  return rows.map((r) => mapApiRowToSale(r, vehicleById, clientById));
}

/** Vendas de um cliente (com veículo e cliente resolvidos para a UI). */
export async function fetchSalesForClient(clientId: number): Promise<Sale[]> {
  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/sales?clientId=${clientId}&page=${page}&pageSize=100`,
  );

  const clientRow = await apiFetch<Record<string, unknown>>(`/api/clients/${clientId}`);
  const client = mapApiRowToClient(clientRow);
  const clientById = new Map<number, Client>([[client.id, client]]);

  const vehicleIds = [...new Set(rows.map((r) => Number(r.vehicleId)).filter((n) => Number.isFinite(n)))];
  const vehicles = await Promise.all(vehicleIds.map((vid) => fetchVehicle(String(vid))));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  return rows.map((r) => mapApiRowToSale(r, vehicleById, clientById));
}
