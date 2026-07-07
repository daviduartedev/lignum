"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  cancelProductionOrder,
  completeProductionOrder,
  fetchAllProductionOrders,
  fetchProductionOrder,
  fetchProductionOrdersPage,
  fetchProductionOrderStatusCounts,
  startProductionOrder,
  updateProductionOrder,
} from "@/services/internal/productionOrders";

export const PRODUCTION_ORDERS_QUERY_KEY = ["production-orders"] as const;

export function useProductionOrders(opts?: { status?: string }) {
  return useQuery({
    queryKey: [...PRODUCTION_ORDERS_QUERY_KEY, "all", opts?.status ?? ""],
    queryFn: () => fetchAllProductionOrders(opts?.status),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useProductionOrdersPage(
  page: number,
  opts?: { q?: string; status?: string; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? 20;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "";
  return useQuery({
    queryKey: [...PRODUCTION_ORDERS_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () =>
      fetchProductionOrdersPage(page, {
        pageSize,
        q: q || undefined,
        status: status || undefined,
      }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useProductionOrder(routeId: string | undefined) {
  return useQuery({
    queryKey: [...PRODUCTION_ORDERS_QUERY_KEY, "detail", routeId],
    queryFn: () => fetchProductionOrder(routeId!),
    enabled: !!routeId,
    retry: 1,
  });
}

export function useProductionOrderStatusCounts() {
  return useQuery({
    queryKey: [...PRODUCTION_ORDERS_QUERY_KEY, "counts"],
    queryFn: fetchProductionOrderStatusCounts,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useUpdateProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateProductionOrder(routeId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRODUCTION_ORDERS_QUERY_KEY });
      toast.success("Ordem de produção atualizada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useStartProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => startProductionOrder(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRODUCTION_ORDERS_QUERY_KEY });
      toast.success("Produção iniciada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useCompleteProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => completeProductionOrder(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRODUCTION_ORDERS_QUERY_KEY });
      toast.success("Ordem de produção concluída.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useCancelProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => cancelProductionOrder(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PRODUCTION_ORDERS_QUERY_KEY });
      toast.success("Ordem de produção cancelada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
