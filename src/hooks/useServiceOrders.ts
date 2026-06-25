"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createServiceOrder,
  fetchAllServiceOrders,
  fetchServiceOrder,
  fetchServiceOrdersPage,
  updateServiceOrder,
} from "@/services/internal/serviceOrders";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const SERVICE_ORDERS_QUERY_KEY = ["service-orders"] as const;

export function useServiceOrders() {
  return useQuery({
    queryKey: [...SERVICE_ORDERS_QUERY_KEY, "all"],
    queryFn: fetchAllServiceOrders,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useServiceOrdersPage(
  page: number,
  opts?: { q?: string; status?: string; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "todos";
  return useQuery({
    queryKey: [...SERVICE_ORDERS_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () => fetchServiceOrdersPage(page, { pageSize, q: q || undefined, status }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useServiceOrder(routeId: string | undefined) {
  return useQuery({
    queryKey: [...SERVICE_ORDERS_QUERY_KEY, "one", routeId],
    queryFn: () => fetchServiceOrder(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createServiceOrder(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SERVICE_ORDERS_QUERY_KEY });
      toast.success("Ordem de serviço criada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateServiceOrder(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: SERVICE_ORDERS_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...SERVICE_ORDERS_QUERY_KEY, "one", routeId] });
      toast.success("OS atualizada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
