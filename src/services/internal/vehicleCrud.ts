import { apiFetch } from "@/lib/apiClient";
import { mapApiRowToVehicle } from "@/lib/mappers/vehicle";
import type { Vehicle } from "@/types";

export async function fetchVehicle(routeId: string): Promise<Vehicle> {
  const row = await apiFetch<Record<string, unknown>>(`/api/vehicles/${encodeURIComponent(routeId)}`);
  return mapApiRowToVehicle(row);
}

export async function createVehicle(body: Record<string, unknown>): Promise<Vehicle> {
  const row = await apiFetch<Record<string, unknown>>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToVehicle(row);
}

export async function updateVehicle(routeId: string, body: Record<string, unknown>): Promise<Vehicle> {
  const row = await apiFetch<Record<string, unknown>>(`/api/vehicles/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToVehicle(row);
}

/** Arquiva o veículo (status `removido`), fluxo normal de “excluir” do estoque. */
export async function archiveVehicle(routeId: string | number): Promise<Vehicle> {
  const id = typeof routeId === "number" ? String(routeId) : routeId;
  return updateVehicle(id, { status: "removido" });
}

export async function restoreVehicle(routeId: string | number, status: string): Promise<Vehicle> {
  const id = typeof routeId === "number" ? String(routeId) : routeId;
  const row = await apiFetch<Record<string, unknown>>(`/api/vehicles/${encodeURIComponent(id)}/restore`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return mapApiRowToVehicle(row);
}

/** Envia ficheiros para `POST /api/upload` e devolve URLs públicas HTTPS. */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const { uploadStaffFiles } = await import("@/services/internal/staffUpload");
  return uploadStaffFiles(files);
}
