"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { createSeller, fetchSellers, type CreateSellerPayload } from "@/services/internal/sellers";

export const SELLERS_QUERY_KEY = ["sellers"] as const;

export function useSellers() {
  return useQuery({
    queryKey: SELLERS_QUERY_KEY,
    queryFn: fetchSellers,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

export function useCreateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSellerPayload) => createSeller(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: SELLERS_QUERY_KEY });
      toast.success("Vendedor cadastrado com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
