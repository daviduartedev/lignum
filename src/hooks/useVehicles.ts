"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { DASHBOARD_SUMMARY_QUERY_KEY } from "@/hooks/useDashboardSummary";
import {
  archiveVehicle,
  createVehicle,
  fetchVehicle,
  restoreVehicle,
  updateVehicle,
} from "@/services/internal/vehicleCrud";
import { fetchAllVehicles } from "@/services/internal/vehicles";
export const VEHICLES_QUERY_KEY = ["vehicles"] as const;

export function useVehicles() {
  return useQuery({
    queryKey: [...VEHICLES_QUERY_KEY, "all"],
    queryFn: fetchAllVehicles,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: [...VEHICLES_QUERY_KEY, "one", id],
    queryFn: () => fetchVehicle(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createVehicle(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
      toast.success("Veículo cadastrado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updateVehicle(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...VEHICLES_QUERY_KEY, "one", routeId] });
      toast.success("Veículo atualizado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useArchiveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string | number) => archiveVehicle(routeId),
    onSuccess: (_, routeId) => {
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...VEHICLES_QUERY_KEY, "one", String(routeId)] });
      toast.success("Veículo movido para removidos.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useRestoreVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, status }: { routeId: string | number; status: string }) =>
      restoreVehicle(routeId, status),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: [...VEHICLES_QUERY_KEY, "one", String(routeId)] });
      toast.success("Veículo restaurado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
