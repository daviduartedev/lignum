"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { INBOX_SUMMARY_KEY } from "@/hooks/useInboxSummary";
import { fetchUserInboxPreferences, saveUserInboxPreferences } from "@/services/internal/inbox";

export const USER_INBOX_PREFERENCES_KEY = ["user-inbox-preferences"] as const;

export function useUserInboxPreferences() {
  return useQuery({
    queryKey: USER_INBOX_PREFERENCES_KEY,
    queryFn: fetchUserInboxPreferences,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useSaveUserInboxPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveUserInboxPreferences,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USER_INBOX_PREFERENCES_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
      toast.success("Preferências salvas.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
