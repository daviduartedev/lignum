"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MercosulPlate } from "@/components/ui/MercosulPlate";
import {
  ListingStatCell,
  listingTdStat,
  listingTdText,
  listingThStat,
  listingThText,
} from "@/components/ui/ListingStatCell";
import { VehicleListingCell } from "@/components/ui/VehicleListingCell";
import { Loader2, Info, ImageIcon, Paperclip } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { vehicleAttrs, vehicleDisplayName, type Vehicle } from "@/types";
import { vehicleStatusBadgeClass, vehicleStatusLabel } from "@/lib/vehicleStatusBadge";
import type { VehicleStatus } from "@prisma/client";

/**
 * Central /documentos — **mídias e anexos por veículo**.
 *
 * Escopo (spec/features/client-documents/readme.md): esta página trata apenas
 * de mídias por veículo. Contratos vivem em `/contratos` (lista, detalhe e
 * geração de PDF preenchido). Documentos do cliente vivem em `/clientes/[id]`.
 * Modelos de contrato são parte do domínio de contratos — não desta central.
 */

function firstAttachmentUrl(v: Vehicle): string | undefined {
  const data = vehicleAttrs(v).attachments?.data;
  if (!Array.isArray(data) || data.length === 0) return undefined;
  const url = data[0]?.url?.trim();
  return url || undefined;
}

export function DocumentosHub() {
  const { data: vehiclesData = [], isLoading: loadingV } = useVehicles();

  const vehicleRows = useMemo(() => {
    const list = Array.isArray(vehiclesData) ? vehiclesData : [];
    return list.map((v: Vehicle) => {
      const a = vehicleAttrs(v);
      const id = String(v.documentId ?? v.id);
      const attachments = a.attachments?.data;
      const gallery = a.gallery?.data;
      const main = a.main_photo as { data?: unknown } | undefined;
      const nAttach = Array.isArray(attachments) ? attachments.length : 0;
      const nGal = Array.isArray(gallery) ? gallery.length : 0;
      const hasMain = !!(main?.data ?? (a.main_photo as { url?: string } | undefined)?.url);
      const score = (hasMain ? 1 : 0) + nAttach + nGal;
      const status = a.status as VehicleStatus;
      return {
        id,
        vehicle: v,
        titulo: vehicleDisplayName(v),
        placa: String(a.plate ?? ""),
        status,
        midias: score,
        anexos: nAttach,
        attachmentUrl: firstAttachmentUrl(v),
      };
    });
  }, [vehiclesData]);

  const kpis = useMemo(() => {
    const comMidia = vehicleRows.filter((r) => r.midias > 0).length;
    const comAnexo = vehicleRows.filter((r) => r.anexos > 0).length;
    return {
      totalVeiculos: vehicleRows.length,
      comMidia,
      comAnexo,
    };
  }, [vehicleRows]);

  if (loadingV) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 mb-4 animate-spin text-emerald-600" />
        <p className="text-sm font-medium">Carregando mídias por veículo…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-1">Documentos</h1>
        <p className="text-sm text-[#6B7280]">
          Mídias e anexos por veículo. Contratos ficam em Contratos; documentos do cliente, no
          histórico de cada cliente.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] text-sm">
            <ImageIcon className="w-4 h-4 text-emerald-600" /> Veículos
          </div>
          <div className="text-2xl font-semibold text-[#111827]">{kpis.totalVeiculos}</div>
        </Card>
        <Card className="p-5 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] text-sm">
            <ImageIcon className="w-4 h-4 text-green-600" /> Com mídia
          </div>
          <div className="text-2xl font-semibold text-[#111827]">{kpis.comMidia}</div>
        </Card>
        <Card className="p-5 border border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-3 text-[#6B7280] text-sm">
            <Paperclip className="w-4 h-4 text-blue-600" /> Com anexo
          </div>
          <div className="text-2xl font-semibold text-[#111827]">{kpis.comAnexo}</div>
        </Card>
      </div>

      <Card className="p-6 border border-[#E5E7EB]">
        <h2 className="text-sm font-semibold text-[#111827] mb-1">Mídias por veículo</h2>
        <p className="text-xs text-[#6B7280] mb-4">Fotos e anexos cadastrados em cada veículo.</p>
        <Card className="p-4 border border-blue-100 bg-blue-50/80 flex gap-3 items-start mb-4">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Para <strong>CPF, comprovantes e arquivos do cliente</strong>, abra{" "}
            <Link href="/clientes" className="underline font-medium">
              Clientes e fornecedores
            </Link>{" "}
            e use a aba de documentos no histórico do cliente. Para{" "}
            <strong>contratos e PDF preenchido</strong>, vá em{" "}
            <Link href="/contratos" className="underline font-medium">
              Contratos
            </Link>
            .
          </p>
        </Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                <th className={`${listingThStat} text-[#6B7280]`}>Placa</th>
                <th className={`${listingThStat} text-[#6B7280]`}>Status</th>
                <th className={`${listingThStat} text-[#6B7280]`}>Mídias</th>
                <th className={`${listingThText} text-[#6B7280]`}></th>
              </tr>
            </thead>
            <tbody>
              {vehicleRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#6B7280]">
                    Nenhum veículo cadastrado ainda.
                  </td>
                </tr>
              ) : (
                vehicleRows.map((r) => (
                  <tr key={r.id} className="border-b border-[#E5E7EB] last:border-0">
                    <td className={listingTdText}>
                      <VehicleListingCell vehicle={r.vehicle} />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell
                        hideLabel
                        label="Placa"
                        value={r.placa ? <MercosulPlate plate={r.placa} /> : <span className="text-sm text-[#6B7280]">-</span>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell
                        hideLabel
                        label="Status"
                        value={<Badge className={vehicleStatusBadgeClass(r.status)}>{vehicleStatusLabel(r.status)}</Badge>}
                        valueClassName="font-normal"
                      />
                    </td>
                    <td className={listingTdStat}>
                      <ListingStatCell hideLabel label="Mídias" value={String(r.midias)} />
                    </td>
                    <td className={listingTdText}>
                      {r.attachmentUrl ? (
                        <a
                          href={r.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:underline font-medium"
                        >
                          Abrir
                        </a>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          className="h-auto p-0 text-sm text-[#9CA3AF] font-medium cursor-not-allowed"
                          title="Sem anexos"
                        >
                          Abrir
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
