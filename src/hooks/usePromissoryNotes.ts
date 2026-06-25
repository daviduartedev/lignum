"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createPromissoryNote,
  fetchAllPromissoryNotes,
  fetchPromissoryNotesPage,
  fetchPromissoryNote,
  fetchPromissorySummary,
  updatePromissoryNote,
} from "@/services/internal/promissoryNotes";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { CLIENTS_QUERY_KEY } from "@/hooks/useClients";
import { VEHICLES_QUERY_KEY } from "@/hooks/useVehicles";

export const PROMISSORY_NOTES_QUERY_KEY = ["promissory-notes"] as const;

export function usePromissoryNotes() {
  return useQuery({
    queryKey: [...PROMISSORY_NOTES_QUERY_KEY, "all"],
    queryFn: fetchAllPromissoryNotes,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 20,
    retry: 2,
  });
}

export const PROMISSORY_SUMMARY_KEY = [...PROMISSORY_NOTES_QUERY_KEY, "summary"] as const;

export function usePromissorySummary() {
  return useQuery({
    queryKey: PROMISSORY_SUMMARY_KEY,
    queryFn: fetchPromissorySummary,
    staleTime: 60_000,
  });
}

export function usePromissoryNotesPage(
  page: number,
  opts?: { q?: string; status?: string; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q ?? "";
  const status = opts?.status ?? "todos";
  return useQuery({
    queryKey: [...PROMISSORY_NOTES_QUERY_KEY, "page", page, pageSize, q, status],
    queryFn: () => fetchPromissoryNotesPage(page, { pageSize, q: q || undefined, status }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 20,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function usePromissoryNote(routeId: string | undefined) {
  return useQuery({
    queryKey: [...PROMISSORY_NOTES_QUERY_KEY, "one", routeId],
    queryFn: () => fetchPromissoryNote(routeId!),
    enabled: !!routeId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePromissoryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createPromissoryNote(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROMISSORY_NOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PROMISSORY_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast.success("Promissória salva com sucesso!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useUpdatePromissoryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: Record<string, unknown> }) =>
      updatePromissoryNote(routeId, data),
    onSuccess: (_, { routeId }) => {
      void qc.invalidateQueries({ queryKey: PROMISSORY_NOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: PROMISSORY_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: [...PROMISSORY_NOTES_QUERY_KEY, "one", routeId] });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast.success("Promissória atualizada!");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
