"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetchPaginated } from "@/lib/apiClient";

export const PURCHASE_EVALUATIONS_QUERY_KEY = ["purchase-evaluations"] as const;

export type PurchaseEvaluationOutcomeFilter = "pendente" | "comprado" | "nao_comprado";

export type PurchaseEvaluationRow = Record<string, unknown>;

export function usePurchaseEvaluationsPage(opts: {
  page: number;
  pageSize: number;
  outcome?: PurchaseEvaluationOutcomeFilter;
}) {
  const { page, pageSize, outcome } = opts;
  return useQuery({
    queryKey: [...PURCHASE_EVALUATIONS_QUERY_KEY, "page", page, pageSize, outcome ?? "all"],
    queryFn: async () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));
      if (outcome) sp.set("outcome", outcome);
      return apiFetchPaginated<PurchaseEvaluationRow>(`/api/purchase-evaluations?${sp.toString()}`);
    },
    staleTime: 1000 * 60,
    retry: 1,
  });
}

