"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createUsedBody,
  deleteUsedBody,
  fetchAllUsedBodies,
  fetchUsedBodiesPage,
  fetchUsedBody,
  fetchUsedBodyStatusCounts,
  updateUsedBody,
} from "@/services/internal/usedBodies";

export const USED_BODIES_QUERY_KEY = ["used-bodies"] as const;

export function useUsedBodies(opts?: { status?: string }) {
  return useQuery({
    queryKey: [...USED_BODIES_QUERY_KEY, "all", opts?.status ?? ""],
    queryFn: () => fetchAllUsedBodies(opts?.status),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useUsedBodiesPage(
  page: number,
  opts?: { q?: string; status?: string; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? 12;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "";
  return useQuery({
    queryKey: [...USED_BODIES_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () => fetchUsedBodiesPage(page, { pageSize, q: q || undefined, status: status || undefined }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useUsedBody(routeId: string | undefined) {
  return useQuery({
    queryKey: [...USED_BODIES_QUERY_KEY, "detail", routeId],
    queryFn: () => fetchUsedBody(routeId!),
    enabled: !!routeId,
    retry: 1,
  });
}

export function useUsedBodyStatusCounts() {
  return useQuery({
    queryKey: [...USED_BODIES_QUERY_KEY, "counts"],
    queryFn: fetchUsedBodyStatusCounts,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useCreateUsedBody() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createUsedBody(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USED_BODIES_QUERY_KEY });
      toast.success("Carroceria usada cadastrada com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateUsedBody() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateUsedBody(routeId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USED_BODIES_QUERY_KEY });
      toast.success("Carroceria usada atualizada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteUsedBody() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteUsedBody(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USED_BODIES_QUERY_KEY });
      toast.success("Carroceria usada removida.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
