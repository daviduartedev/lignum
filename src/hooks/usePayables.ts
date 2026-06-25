"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  confirmPayablePayment,
  createPayable,
  fetchAllOpenPayables,
  fetchAllPayables,
  fetchPayablesPage,
} from "@/services/internal/payables";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const PAYABLES_QUERY_KEY = ["payables"] as const;

export function useOpenPayables() {
  return useQuery({
    queryKey: [...PAYABLES_QUERY_KEY, "open"],
    queryFn: fetchAllOpenPayables,
    staleTime: 60_000,
    retry: 2,
  });
}

export function usePayables() {
  return useQuery({
    queryKey: [...PAYABLES_QUERY_KEY, "all"],
    queryFn: fetchAllPayables,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 20,
    retry: 2,
  });
}

export function usePayablesPage(page: number, opts?: { q?: string; status?: string; origin?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "todos";
  const origin = opts?.origin ?? "todos";
  return useQuery({
    queryKey: [...PAYABLES_QUERY_KEY, "page", page, pageSize, q, status, origin],
    queryFn: () => fetchPayablesPage(page, { pageSize, q: q || undefined, status, origin }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 20,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useCreatePayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createPayable(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      toast.success("Conta a pagar salva!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useConfirmPayablePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => confirmPayablePayment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      toast.success("Pagamento confirmado!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
