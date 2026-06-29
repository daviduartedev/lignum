"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={isMutating}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">
            {isEditing ? "Editar cliente" : "Novo cliente"}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {isEditing
              ? `Atualizando dados de ${values.fullName || "…"}`
              : "Cadastre um cliente comprador ou contato comercial"}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card className="p-8 border border-[#E5E7EB] shadow-sm max-w-2xl">
          <div className="space-y-6">
            <ClientFormFields
              values={values}
              onChange={handleChange}
              idPrefix="form-cliente"
              onLookupCnpj={() => lookupMutation.mutate(values)}
              lookupPending={lookupMutation.isPending}
            />

            {isEditing && clientData?.id ? (
              <ClientDocumentsSection clientId={clientData.id} />
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isMutating}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#22C55E] hover:bg-[#16A34A] text-white" disabled={isMutating}>
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Salvar</span>
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
