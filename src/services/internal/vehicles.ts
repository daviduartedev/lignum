import { apiFetch } from "@/lib/apiClient";
import { mapApiRowToVehicle } from "@/lib/mappers/vehicle";
import type { Vehicle } from "@/types";

export async function fetchAllVehicles(): Promise<Vehicle[]> {
  const rows = await apiFetch<Record<string, unknown>[]>("/api/vehicles?all=1");
  return rows.map(mapApiRowToVehicle);
}
