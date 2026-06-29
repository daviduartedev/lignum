"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBodyModels } from "@/services/internal/bodyModels";

export const BODY_MODELS_QUERY_KEY = ["body-models"] as const;

export function useBodyModels() {
  return useQuery({
    queryKey: BODY_MODELS_QUERY_KEY,
    queryFn: fetchBodyModels,
    staleTime: 1000 * 60 * 10,
  });
}
