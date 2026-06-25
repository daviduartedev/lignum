"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createWarranty,
  fetchAllWarranties,
  fetchWarrantiesPage,
  fetchWarranty,
  fetchWarrantySummary,
  updateWarranty,
} from "@/services/internal/warranties";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";
import { VEHICLES_QUERY_KEY } from "@/hooks/useVehicles";

export const WARRANTIES_QUERY_KEY = ["warranties"] as const;

export function useWarranties() {
  return useQuery({
    queryKey: [...WARRANTIES_QUERY_KEY, "all"],
    queryFn: fetchAllWarranties,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 20,
    retry: 2,
  });
}

export const WARRANTY_SUMMARY_KEY = [...WARRANTIES_QUERY_KEY, "summary"] as const;

export function useWarrantySummary() {
  return useQuery({
    queryKey: WARRANTY_SUMMARY_KEY,
    queryFn: fetchWarrantySummary,
    staleTime: 60_000,
  });
}

export function useWarrantiesPage(page: number, opts?: { q?: string; status?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "todos";
  return useQuery({
    queryKey: [...WARRANTIES_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () => fetchWarrantiesPage(page, { pageSize, q: q || undefined, status }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 20,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useWarranty(routeId: string | undefined) {
  return useQuery({
    queryKey: [...WARRANTIES_QUERY_KEY, "one", routeId],
    queryFn: () => fetchWarranty(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createWarranty(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WARRANTIES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: WARRANTY_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast.success("Garantia criada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateWarranty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateWarranty(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: WARRANTIES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: WARRANTY_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: [...WARRANTIES_QUERY_KEY, "one", routeId] });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast.success("Garantia atualizada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
