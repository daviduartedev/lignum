import { apiFetch } from "@/lib/apiClient";
import { mapApiRowToBodyModel } from "@/lib/mappers/quote";
import type { BodyModel } from "@/types/quotes";

export async function fetchBodyModels(): Promise<BodyModel[]> {
  const rows = await apiFetch<Record<string, unknown>[]>("/api/body-models");
  return rows.map(mapApiRowToBodyModel);
}
