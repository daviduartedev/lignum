"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createClientDocument,
  deleteClientDocument,
  fetchClientDocumentsPage,
} from "@/services/internal/clientDocuments";

export const CLIENT_DOCUMENTS_QUERY_KEY = ["client-documents"] as const;

export function useClientDocuments(clientId: number | undefined, page = 1) {
  return useQuery({
    queryKey: [...CLIENT_DOCUMENTS_QUERY_KEY, clientId, page],
    queryFn: () => fetchClientDocumentsPage(clientId!, page),
    enabled: clientId != null && clientId > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateClientDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClientDocument,
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: [...CLIENT_DOCUMENTS_QUERY_KEY, vars.clientId] });
      toast.success("Documento adicionado.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteClientDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; clientId: number }) => deleteClientDocument(id),
    onSuccess: (_, { clientId }) => {
      void qc.invalidateQueries({ queryKey: [...CLIENT_DOCUMENTS_QUERY_KEY, clientId] });
      toast.success("Documento removido.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
