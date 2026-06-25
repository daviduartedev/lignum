"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/services/internal/dashboardSummary";

export const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboardSummary"] as const;

export function useDashboardSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
    gcTime: 1000 * 60 * 15,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}
