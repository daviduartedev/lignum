"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  calculateQuote,
  convertQuote,
  createQuote,
  deleteQuote,
  fetchQuote,
  fetchQuotesPage,
  updateQuote,
} from "@/services/internal/quotes";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const QUOTES_QUERY_KEY = ["quotes"] as const;

export function useQuotesPage(page: number, opts?: { q?: string; status?: string; pageSize?: number }) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  const status = opts?.status;
  return useQuery({
    queryKey: [...QUOTES_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () => fetchQuotesPage(page, { pageSize, q: q || undefined, status }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });
}

export function useQuote(routeId: string | undefined) {
  return useQuery({
    queryKey: [...QUOTES_QUERY_KEY, "one", routeId],
    queryFn: () => fetchQuote(routeId!),
    enabled: !!routeId,
  });
}

export function useCalculateQuote() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => calculateQuote(body),
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createQuote(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      toast.success("Orçamento criado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateQuote(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...QUOTES_QUERY_KEY, "one", routeId] });
      toast.success("Orçamento atualizado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => deleteQuote(routeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      toast.success("Orçamento excluído.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => convertQuote(routeId),
    onSuccess: (_, routeId) => {
      void qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...QUOTES_QUERY_KEY, "one", routeId] });
      toast.success("Ficha técnica gerada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
