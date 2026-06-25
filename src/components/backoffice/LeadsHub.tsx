"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listingTdActions,
  listingTdText,
  listingThActions,
  listingThText,
} from "@/components/ui/ListingStatCell";
import { Loader2, Mail, Phone, Car, CheckCheck, Inbox } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "@/lib/toast";

/**
 * Central de leads da vitrine (cycle 0618). Staff, tenant-scoped via API.
 * Lista os leads recebidos pelo formulário público e permite marcar como lido.
 */

type LeadVehicle = { id: number; brand: string; model: string; plate: string } | null;

type LeadRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  vehicle?: LeadVehicle;
  source: string;
  consentAt?: string;
  readAt?: string | null;
  createdAt?: string;
};

export function LeadsHub() {
  const qc = useQueryClient();
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", onlyUnread ? "unread" : "all"],
    queryFn: () => apiFetch<LeadRow[]>(`/api/leads?pageSize=50${onlyUnread ? "&unread=1" : ""}`),
    staleTime: 1000 * 30,
  });

  const markRead = useMutation({
    mutationFn: (vars: { id: number; read: boolean }) =>
      apiFetch(`/api/leads/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ read: vars.read }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: () => toast.error("Não foi possível atualizar o lead."),
  });

  const rows = useMemo(() => (Array.isArray(leads) ? leads : []), [leads]);
  const unreadCount = useMemo(() => rows.filter((l) => !l.readAt).length, [rows]);

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-1">Leads da vitrine</h1>
          <p className="text-sm text-[#6B7280]">
            Contatos recebidos pelo formulário da loja pública.
          </p>
        </div>
        <Button
          type="button"
          variant={onlyUnread ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyUnread((v) => !v)}
        >
          {onlyUnread ? "Mostrando não lidos" : `Só não lidos (${unreadCount})`}
        </Button>
      </div>

      <Card className="p-6 border border-[#E5E7EB]">
        {isLoading ? (
          <div className="flex justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#6B7280]">
            <Inbox className="w-10 h-10 mb-3 text-[#9CA3AF]" />
            <p className="text-sm">Nenhum lead {onlyUnread ? "não lido" : "recebido ainda"}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className={`${listingThText} text-[#6B7280]`}>Contato</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Mensagem</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Veículo</th>
                  <th className={`${listingThText} text-[#6B7280]`}>Recebido</th>
                  <th className={`${listingThActions} text-[#6B7280]`} />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] ${
                      l.readAt ? "" : "bg-emerald-50/40"
                    }`}
                  >
                    <td className={listingTdText}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[#111827] flex items-center gap-2">
                          {l.name}
                          {!l.readAt ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0">Novo</Badge>
                          ) : null}
                        </span>
                        <a href={`mailto:${l.email}`} className="text-xs text-[#6B7280] hover:underline inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {l.email}
                        </a>
                        <a href={`tel:${l.phone}`} className="text-xs text-[#6B7280] hover:underline inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {l.phone}
                        </a>
                      </div>
                    </td>
                    <td className={`${listingTdText} text-[#6B7280] max-w-[280px]`}>
                      <span className="line-clamp-3 break-words">{l.message || "—"}</span>
                    </td>
                    <td className={`${listingTdText} text-[#6B7280]`}>
                      {l.vehicle ? (
                        <span className="inline-flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" />
                          {l.vehicle.brand} {l.vehicle.model}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${listingTdText} text-[#6B7280]`}>{fmtDate(l.createdAt)}</td>
                    <td className={listingTdActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={l.readAt ? "text-[#9CA3AF]" : "text-emerald-600"}
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate({ id: l.id, read: !l.readAt })}
                      >
                        <CheckCheck className="w-4 h-4 mr-1" />
                        {l.readAt ? "Marcar não lido" : "Marcar lido"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
