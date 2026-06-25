"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createSupplier,
  deleteSupplier,
  fetchAllSuppliers,
  fetchSuppliersPage,
  updateSupplier,
} from "@/services/internal/suppliers";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { CRM_SUMMARY_KEY } from "@/hooks/useCrmSummary";

export const SUPPLIERS_QUERY_KEY = ["suppliers"] as const;

export function useSuppliers() {
  return useQuery({
    queryKey: [...SUPPLIERS_QUERY_KEY, "all"],
    queryFn: fetchAllSuppliers,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}

export function useSuppliersPage(page: number, opts?: { q?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  return useQuery({
    queryKey: [...SUPPLIERS_QUERY_KEY, "page", page, pageSize, q],
    queryFn: () => fetchSuppliersPage(page, { pageSize, q: q || undefined }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createSupplier(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Fornecedor cadastrado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateSupplier(routeId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Fornecedor atualizado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteSupplier(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Fornecedor removido.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
