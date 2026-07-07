"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createMaterial,
  createStockMovement,
  fetchAllMaterials,
  fetchMaterial,
  fetchMaterialsPage,
  fetchMaterialsSummary,
  updateMaterial,
} from "@/services/internal/materials";

export const MATERIALS_QUERY_KEY = ["materials"] as const;

export function useMaterialsSummary() {
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEY, "summary"],
    queryFn: fetchMaterialsSummary,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useMaterialsPage(
  page: number,
  opts?: { q?: string; category?: string; belowMinimum?: boolean; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? 50;
  const q = opts?.q ?? "";
  const category = opts?.category ?? "";
  const belowMinimum = opts?.belowMinimum ?? false;
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEY, "page", page, pageSize, q, category, belowMinimum],
    queryFn: () =>
      fetchMaterialsPage(page, {
        pageSize,
        q: q || undefined,
        category: category || undefined,
        belowMinimum: belowMinimum || undefined,
      }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useAllMaterials() {
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEY, "all"],
    queryFn: fetchAllMaterials,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useMaterial(routeId: string | undefined) {
  return useQuery({
    queryKey: [...MATERIALS_QUERY_KEY, "detail", routeId],
    queryFn: () => fetchMaterial(routeId!),
    enabled: !!routeId,
    retry: 1,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createMaterial(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      toast.success("Material cadastrado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateMaterial(routeId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      toast.success("Material atualizado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createStockMovement(data),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      const type = vars.type === "saida" ? "Saída" : "Entrada";
      toast.success(`${type} de estoque registrada.`);
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
