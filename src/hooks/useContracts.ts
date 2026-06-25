"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createContract,
  fetchAllContracts,
  fetchContract,
  fetchContractsPage,
  updateContract,
} from "@/services/internal/contracts";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const CONTRACTS_QUERY_KEY = ["contracts"] as const;

export function useContracts() {
  return useQuery({
    queryKey: [...CONTRACTS_QUERY_KEY, "all"],
    queryFn: fetchAllContracts,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useContractsPage(page: number, opts?: { q?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  return useQuery({
    queryKey: [...CONTRACTS_QUERY_KEY, "page", page, pageSize, q],
    queryFn: () => fetchContractsPage(page, { pageSize, q: q || undefined }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useContract(routeId: string | undefined) {
  return useQuery({
    queryKey: [...CONTRACTS_QUERY_KEY, "one", routeId],
    queryFn: () => fetchContract(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createContract(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      toast.success("Contrato criado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateContract(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: CONTRACTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...CONTRACTS_QUERY_KEY, "one", routeId] });
      toast.success("Contrato atualizado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
