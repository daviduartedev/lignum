"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { VEHICLES_QUERY_KEY } from "@/hooks/useVehicles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useVehicle } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { apiFetch } from "@/lib/apiClient";
import { strapiEntityId } from "@/lib/strapiEntity";
import { toast } from "@/lib/toast";
import { clientAttrs, vehicleDisplayName, type Client, type Vehicle } from "@/types";

const REASONS: { value: string; label: string }[] = [
  { value: "preco", label: "Preço / margem" },
  { value: "estado", label: "Estado do veículo" },
  { value: "documentacao", label: "Documentação" },
  { value: "desistencia", label: "Desistência do cliente" },
  { value: "outro", label: "Outro" },
];

type Props = { routeId: string };

export function AvaliacaoCompra({ routeId }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: vehicle, isLoading, isError } = useVehicle(routeId);
  const { data: clients = [] } = useClients();

  const [clientId, setClientId] = useState<string>("__none__");
  const [outcome, setOutcome] = useState<string>("pendente");
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setSubmitting(true);
    try {
      const cid =
        clientId && clientId !== "__none__" ? parseInt(clientId, 10) : undefined;
      const body: Record<string, unknown> = {
        vehicleId: vehicle.id,
        outcome,
        clientId: cid && Number.isFinite(cid) ? cid : undefined,
      };
      if (outcome === "nao_comprado") {
        body.reasonCode = reasonCode || undefined;
        body.reasonDetail = reasonDetail.trim() || undefined;
      }
      await apiFetch("/api/purchase-evaluations", {
        method: "POST",
        body: JSON.stringify(body),
      });
      void qc.invalidateQueries({ queryKey: VEHICLES_QUERY_KEY });
      toast.success("Avaliação de compra registrada.");
      router.push(`/veiculo/${strapiEntityId(vehicle as Vehicle) ?? routeId}`);
    } catch (err: unknown) {
      toast.apiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Veículo não encontrado</AlertTitle>
        <AlertDescription>
          <Link href="/estoque">
            <Button variant="outline" size="sm" className="mt-2">
              Estoque
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const title = vehicleDisplayName(vehicle as Vehicle);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={submitting}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Avaliação de compra</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <Card className="p-6 border border-border">
          <div className="space-y-4">
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem cliente cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Não associar</SelectItem>
                  {clients.map((c) => {
                    const ca = clientAttrs(c as Client);
                    return (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {ca.full_name || `Cliente #${c.id}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resultado *</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="comprado">Comprado pela loja</SelectItem>
                  <SelectItem value="nao_comprado">Não comprado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {outcome === "nao_comprado" && (
              <>
                <div>
                  <Label>Motivo (opcional)</Label>
                  <Select value={reasonCode || undefined} onValueChange={setReasonCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Detalhes {reasonCode === "outro" ? "*" : "(opcional)"}</Label>
                  <Textarea
                    rows={3}
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="Complemento do motivo…"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
