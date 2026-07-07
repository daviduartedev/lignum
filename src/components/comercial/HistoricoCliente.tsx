"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, AlertCircle } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { useMemo } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EntityAvatar, StitchKpiCard, StitchSectionCard } from "@/components/ui/stitch";
import { ClientDocumentsSection } from "@/components/comercial/ClientDocumentsSection";
import { clientAttrs } from "@/types";

export function HistoricoCliente() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { data: rawClient, isLoading: loadingClient, isError: errorClient } = useClient(id);
  const clientId = rawClient?.id;

  const cliente = useMemo(() => {
    if (!rawClient) return null;
    const a = clientAttrs(rawClient);
    return {
      nome: a.full_name || "Sem nome",
      cpf: a.document || "-",
      telefone: a.phone || "-",
      email: a.email || "-",
      endereco: a.address || "-",
      cadastro: a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "-",
    };
  }, [rawClient]);

  const kpiData = useMemo(() => {
    if (!cliente) return [];
    return [
      { label: "Cliente desde", valor: cliente.cadastro, icon: FileText, cor: "blue" },
      { label: "E-mail", valor: cliente.email, icon: FileText, cor: "green" },
      { label: "Telefone", valor: cliente.telefone, icon: FileText, cor: "purple" },
      { label: "Documento", valor: cliente.cpf, icon: FileText, cor: "amber" },
    ];
  }, [cliente]);

  if (loadingClient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando histórico…</p>
      </div>
    );
  }

  if (errorClient || !cliente || !id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-[#111827]">Erro</h1>
        </div>
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Cliente não encontrado</AlertTitle>
          <AlertDescription className="text-red-700">
            Não foi possível carregar o histórico deste cliente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <EntityAvatar name={cliente.nome} variant="client" className="w-10 h-10 text-xs rounded-lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">{cliente.nome}</h1>
              <p className="text-sm text-muted-foreground tabular-nums">{cliente.cpf}</p>
            </div>
          </div>
          <Link href={`/clientes/${id}/editar`} className="sm:ml-auto">
            <Button variant="outline" size="sm">
              Editar cadastro
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const tones = ["primary", "success", "accent", "warning"] as const;
          return (
            <StitchKpiCard
              key={index}
              label={kpi.label}
              value={kpi.valor}
              icon={Icon}
              tone={tones[index % tones.length]}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <StitchSectionCard title="Dados cadastrais">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Telefone</div>
              <div className="text-sm font-medium text-foreground mt-1">{cliente.telefone}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">E-mail</div>
              <div className="text-sm font-medium text-foreground mt-1">{cliente.email}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Endereço</div>
              <div className="text-sm font-medium text-foreground mt-1 leading-snug">{cliente.endereco}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Cliente desde</div>
              <div className="text-sm font-medium text-foreground mt-1">{cliente.cadastro}</div>
            </div>
          </div>
        </StitchSectionCard>

        <StitchSectionCard title="Documentos" className="xl:col-span-2">
          {clientId != null ? <ClientDocumentsSection clientId={clientId} /> : null}
        </StitchSectionCard>
      </div>
    </div>
  );
}
