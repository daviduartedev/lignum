import { apiFetch } from "@/lib/apiClient";
import type { SenatranNormalizedVehicle } from "@/lib/senatran/types";

export type SenatranLookupResponse = {
  normalized: SenatranNormalizedVehicle;
  cached: boolean;
  provider: string;
  cost: number;
};

export async function senatranLookup(body: { plate?: string; renavam?: string }): Promise<SenatranLookupResponse> {
  return apiFetch<SenatranLookupResponse>("/api/senatran/lookup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type SenatranUsageResponse = {
  monthTotal: string;
  currency: string;
  isDemo: boolean;
  provider: string;
};

export async function fetchSenatranUsage(): Promise<SenatranUsageResponse> {
  return apiFetch<SenatranUsageResponse>("/api/senatran/usage");
}
