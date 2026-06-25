import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToEvaluation } from "@/lib/mappers/evaluation";
import type { Evaluation } from "@/types";

export async function fetchEvaluationsByVehicle(vehicleId: number): Promise<Evaluation[]> {
  const rows = await fetchAllPaginated<Record<string, unknown>>(
    (page) => `/api/evaluations?vehicleId=${vehicleId}&page=${page}&pageSize=100`,
  );
  return rows.map((r) => mapApiRowToEvaluation(r));
}

export async function fetchEvaluationsByVehiclePage(
  vehicleId: number,
  page: number,
  opts?: { pageSize?: number },
): Promise<{ items: Evaluation[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const url = `/api/evaluations?vehicleId=${vehicleId}&page=${page}&pageSize=${pageSize}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToEvaluation(r)), meta };
}

export async function createEvaluation(body: Record<string, unknown>): Promise<Evaluation> {
  const row = await apiFetch<Record<string, unknown>>("/api/evaluations", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToEvaluation(row);
}
