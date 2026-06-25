"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createClient,
  deleteClient,
  fetchAllClients,
  fetchClient,
  fetchClientsPage,
  updateClient,
} from "@/services/internal/clients";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { CRM_SUMMARY_KEY } from "@/hooks/useCrmSummary";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export function useClients() {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, "all"],
    queryFn: fetchAllClients,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useClientsPage(page: number, opts?: { q?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, "page", page, pageSize, q],
    queryFn: () => fetchClientsPage(page, { pageSize, q: q || undefined }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useClient(routeId: string | undefined) {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, "one", routeId],
    queryFn: () => fetchClient(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createClient(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateClient(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...CLIENTS_QUERY_KEY, "one", routeId] });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteClient(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CRM_SUMMARY_KEY });
      toast.success("Cliente removido.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
