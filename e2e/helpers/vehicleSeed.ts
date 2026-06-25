import type { APIRequestContext } from "@playwright/test";
import { readApiData } from "./apiEnvelope";

export type VehicleRow = {
  id: number;
  plate: string;
  status: string;
};

/** Evita `?all=1` (rate-limit agressivo em suites longas). */
export async function findVehicleByPlate(
  request: APIRequestContext,
  plate: string,
): Promise<VehicleRow | undefined> {
  const res = await request.get(
    `/api/vehicles?plate=${encodeURIComponent(plate)}&pageSize=10&page=1`,
  );
  const rows = await readApiData<VehicleRow[]>(res);
  const norm = plate.toUpperCase();
  return rows.find((r) => r.plate.toUpperCase() === norm);
}

export async function putVehicleStatus(
  request: APIRequestContext,
  id: number,
  status: string,
): Promise<void> {
  const res = await request.put(`/api/vehicles/${id}`, {
    data: JSON.stringify({ status }),
  });
  if (!res.ok()) {
    const t = await res.text();
    throw new Error(`PUT vehicle ${id}: ${res.status()} ${t}`);
  }
}
