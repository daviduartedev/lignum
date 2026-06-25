import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToClient } from "@/lib/mappers/client";
import { mapApiRowToPromissoryNote } from "@/lib/mappers/promissoryNote";
import { mapApiRowToVehicle } from "@/lib/mappers/vehicle";
import type { Client, PromissoryNote, Vehicle } from "@/types";

export async function fetchAllPromissoryNotes(): Promise<PromissoryNote[]> {
  const [vRows, cRows] = await Promise.all([
    apiFetch<Record<string, unknown>[]>("/api/vehicles?all=1"),
    apiFetch<Record<string, unknown>[]>("/api/clients?all=1"),
  ]);
  const vehicles: Vehicle[] = vRows.map((r) => mapApiRowToVehicle(r));
  const clients: Client[] = cRows.map((r) => mapApiRowToClient(r));
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/promissory-notes?page=${page}&pageSize=100`,
  );
  return rows.map((r) => mapApiRowToPromissoryNote(r, vehicleById, clientById));
}

export async function fetchPromissoryNotesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: PromissoryNote[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/promissory-notes?page=${page}&pageSize=${pageSize}`;
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
  const items = data.map((r) => mapApiRowToPromissoryNote(r, vehicleById, clientById));
  return { items, meta };
}

export async function fetchPromissoryNote(routeId: string): Promise<PromissoryNote> {
  const row = await apiFetch<Record<string, unknown>>(`/api/promissory-notes/${encodeURIComponent(routeId)}`);
  const [vRow, cRow] = await Promise.all([
    apiFetch<Record<string, unknown>>(`/api/vehicles/${encodeURIComponent(String(row.vehicleId))}`),
    apiFetch<Record<string, unknown>>(`/api/clients/${encodeURIComponent(String(row.clientId))}`),
  ]);
  const veh = mapApiRowToVehicle(vRow);
  const cli = mapApiRowToClient(cRow);
  return mapApiRowToPromissoryNote(row, new Map([[veh.id, veh]]), new Map([[cli.id, cli]]));
}

export async function createPromissoryNote(body: Record<string, unknown>): Promise<PromissoryNote> {
  const row = await apiFetch<Record<string, unknown>>("/api/promissory-notes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return fetchPromissoryNote(String(row.id));
}

export async function updatePromissoryNote(
  routeId: string,
  body: Record<string, unknown>,
): Promise<PromissoryNote> {
  await apiFetch<Record<string, unknown>>(`/api/promissory-notes/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return fetchPromissoryNote(routeId);
}

export type PromissorySummary = {
  aberto: number;
  vencido: number;
  sete: number;
  recebidoMes: number;
};

export async function fetchPromissorySummary(): Promise<PromissorySummary> {
  return apiFetch<PromissorySummary>("/api/promissory-notes/summary");
}
