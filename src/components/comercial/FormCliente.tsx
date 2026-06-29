"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StitchPageHeader, StitchSectionCard } from "@/components/ui/stitch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useClient, useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { maskCPFCNPJ, maskPhoneBR } from "@/lib/masks";
import { clientAttrs } from "@/types";
import {
  ClientFormFields,
  clientAttrsToFormValues,
  clientFormValuesToPayload,
  EMPTY_CLIENT_FORM,
  type ClientFormValues,
} from "@/components/comercial/ClientFormFields";
import { ClientDocumentsSection } from "@/components/comercial/ClientDocumentsSection";
import { useDocumentLookupClient } from "@/hooks/useDocumentLookup";

export function FormCliente() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const isEditing = !!id;

  const { data: clientData, isLoading: loadingClient } = useClient(isEditing ? id : undefined);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const isMutating = createMutation.isPending || updateMutation.isPending;

  const [values, setValues] = useState<ClientFormValues>(EMPTY_CLIENT_FORM);
  const lookupMutation = useDocumentLookupClient((patch) => setValues((prev) => ({ ...prev, ...patch })));

  useEffect(() => {
    if (clientData) {
      const a = clientAttrs(clientData);
      const next = clientAttrsToFormValues(a);
      setValues({
        ...next,
        document: a.document ? maskCPFCNPJ(String(a.document)) : "",
        phone: a.phone ? maskPhoneBR(String(a.phone)) : "",
      });
    }
  }, [clientData]);

  const handleChange = (patch: Partial<ClientFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = clientFormValuesToPayload(values);

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({ routeId: id, data: payload });
        router.push(`/clientes/${id}`);
      } else {
        const created = await createMutation.mutateAsync(payload);
        const next = created.documentId ? String(created.documentId) : String(created.id);
        router.push(`/clientes/${next}`);
      }
    } catch {
      /* toast no hook */
    }
  };

  if (isEditing && loadingClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando dados do cliente…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={isMutating} className="shrink-0 rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <StitchPageHeader
          title={isEditing ? "Editar cliente" : "Novo cliente"}
          description={
            isEditing
              ? `Atualizando dados de ${values.fullName || "…"}`
              : "Cadastre um cliente comprador ou contato comercial"
          }
        />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <StitchSectionCard
          title="Dados cadastrais"
          footer={
            <>
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isMutating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </Button>
            </>
          }
        >
          <div className="space-y-6">
            <ClientFormFields
              values={values}
              onChange={handleChange}
              idPrefix="form-cliente"
              onLookupCnpj={() => lookupMutation.mutate(values)}
              lookupPending={lookupMutation.isPending}
            />

            {isEditing && clientData?.id ? <ClientDocumentsSection clientId={clientData.id} /> : null}
          </div>
        </StitchSectionCard>
      </form>
    </div>
  );
}
