import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToMaterial, mapApiRowToStockMovement, type MaterialDto } from "@/lib/mappers/material";

export type MaterialsSummary = {
  total: number;
  belowMinimum: number;
  totalStockValue: number;
};

export async function fetchMaterialsPage(
  page: number,
  opts?: { pageSize?: number; q?: string; category?: string; belowMinimum?: boolean },
): Promise<{ items: MaterialDto[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  let url = `/api/materials?page=${page}&pageSize=${pageSize}`;
  if (opts?.q) url += `&q=${encodeURIComponent(opts.q)}`;
  if (opts?.category) url += `&category=${encodeURIComponent(opts.category)}`;
  if (opts?.belowMinimum) url += `&belowMinimum=1`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToMaterial(r)), meta };
}

export async function fetchAllMaterials(): Promise<MaterialDto[]> {
  const rows = await apiFetch<Record<string, unknown>[]>("/api/materials?all=1");
  return rows.map((r) => mapApiRowToMaterial(r));
}

export async function fetchMaterialsSummary(): Promise<MaterialsSummary> {
  const rows = await fetchAllMaterials();
  const belowMinimum = rows.filter((m) => m.belowMinimum).length;
  const totalStockValue = rows.reduce((sum, m) => sum + m.currentStock * m.avgCost, 0);
  return { total: rows.length, belowMinimum, totalStockValue };
}

export async function fetchMaterial(routeId: string) {
  const row = await apiFetch<Record<string, unknown>>(`/api/materials/${encodeURIComponent(routeId)}`);
  return mapApiRowToMaterial(row);
}

export async function createMaterial(body: Record<string, unknown>): Promise<MaterialDto> {
  const row = await apiFetch<Record<string, unknown>>("/api/materials", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToMaterial(row);
}

export async function updateMaterial(routeId: string, body: Record<string, unknown>): Promise<MaterialDto> {
  const row = await apiFetch<Record<string, unknown>>(`/api/materials/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToMaterial(row);
}

export async function createStockMovement(body: Record<string, unknown>) {
  const row = await apiFetch<Record<string, unknown>>("/api/stock-movements", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return {
    movement: mapApiRowToStockMovement(row.movement as Record<string, unknown>),
    material: mapApiRowToMaterial(row.material as Record<string, unknown>),
  };
}

export async function fetchStockMovementsPage(
  page: number,
  opts?: { materialId?: number; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? 20;
  let url = `/api/stock-movements?page=${page}&pageSize=${pageSize}`;
  if (opts?.materialId) url += `&materialId=${opts.materialId}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map((r) => mapApiRowToStockMovement(r)), meta };
}
