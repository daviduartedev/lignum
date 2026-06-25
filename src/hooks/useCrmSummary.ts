"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCrmSummary } from "@/services/internal/crmSummary";

export const CRM_SUMMARY_KEY = ["crm-summary"] as const;

export function useCrmSummary() {
  return useQuery({
    queryKey: CRM_SUMMARY_KEY,
    queryFn: fetchCrmSummary,
    staleTime: 60_000,
  });
}
