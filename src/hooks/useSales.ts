"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { DASHBOARD_SUMMARY_QUERY_KEY } from "@/hooks/useDashboardSummary";
import { VEHICLES_QUERY_KEY } from "@/hooks/useVehicles";
import { PROMISSORY_NOTES_QUERY_KEY } from "@/hooks/usePromissoryNotes";
import { fetchAllSales, fetchSalesForClient } from "@/services/internal/sales";
import { createSaleAndMarkVehicleSold, type CreateSalePayload } from "@/services/internal/salesCrud";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";

export const SALES_QUERY_KEY = ["sales"] as const;

export function useSales() {
  return useQuery({
    queryKey: [...SALES_QUERY_KEY, "all"],
    queryFn: fetchAllSales,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useSalesForClient(clientId: number | undefined) {
  return useQuery({
    queryKey: [...SALES_QUERY_KEY, "client", clientId],
    queryFn: () => fetchSalesForClient(clientId!),
    enabled: clientId != null && clientId > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, vehicleRouteId }: { body: CreateSalePayload; vehicleRouteId: string }) =>
      createSaleAndMarkVehicleSold(body, vehicleRouteId),
    onSuccess: (_, { body }) => {
      void qc.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PROMISSORY_NOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...CLIENTS_QUERY_KEY, "one"] });
      void qc.invalidateQueries({ queryKey: [...SALES_QUERY_KEY, "client", body.clientId] });
      toast.success("Venda registrada e veículo marcado como vendido.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
