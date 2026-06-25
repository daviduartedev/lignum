"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createEvaluation,
  fetchEvaluationsByVehicle,
  fetchEvaluationsByVehiclePage,
} from "@/services/internal/evaluations";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const EVALUATIONS_QUERY_KEY = ["evaluations"] as const;

export function useEvaluationsByVehicle(vehicleId: number | undefined) {
  return useQuery({
    queryKey: [...EVALUATIONS_QUERY_KEY, "vehicle", vehicleId],
    queryFn: () => fetchEvaluationsByVehicle(vehicleId!),
    enabled: vehicleId != null && vehicleId > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEvaluationsByVehiclePage(vehicleId: number | undefined, page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: [...EVALUATIONS_QUERY_KEY, "vehicle", vehicleId, "page", page, pageSize],
    queryFn: () => fetchEvaluationsByVehiclePage(vehicleId!, page, { pageSize }),
    enabled: vehicleId != null && vehicleId > 0,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createEvaluation(body),
    onSuccess: (_, variables) => {
      const vid = variables.vehicleId;
      if (typeof vid === "number") {
        void qc.invalidateQueries({ queryKey: [...EVALUATIONS_QUERY_KEY, "vehicle", vid] });
      } else {
        void qc.invalidateQueries({ queryKey: EVALUATIONS_QUERY_KEY });
      }
      toast.success("Avaliação registrada.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
