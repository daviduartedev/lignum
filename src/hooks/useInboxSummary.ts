"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchInboxSummary } from "@/services/internal/inbox";

export const INBOX_SUMMARY_KEY = ["inbox-summary"] as const;

export function useInboxSummary(enabled = true) {
  return useQuery({
    queryKey: INBOX_SUMMARY_KEY,
    queryFn: fetchInboxSummary,
    enabled,
    staleTime: 30_000,
    retry: 2,
  });
}
