"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { ErpSettingFlat } from "@/lib/erpSettingDefaults";
import { INBOX_SUMMARY_KEY } from "@/hooks/useInboxSummary";
import { fetchErpSetting, saveErpSetting } from "@/services/internal/erpSetting";

export const ERP_SETTING_KEY = ["erp-setting"] as const;

export function useErpSettingQuery() {
  return useQuery({
    queryKey: ERP_SETTING_KEY,
    queryFn: fetchErpSetting,
    staleTime: 1000 * 60,
    retry: 2,
  });
}

export function useErpSettingSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ErpSettingFlat) => saveErpSetting(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ERP_SETTING_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
      toast.success("Configurações salvas.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
