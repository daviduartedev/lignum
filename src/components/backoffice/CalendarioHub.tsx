"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, Bell } from "lucide-react";
import { usePromissoryNotes } from "@/hooks/usePromissoryNotes";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { useWarranties } from "@/hooks/useWarranties";
import { useOpenPayables } from "@/hooks/usePayables";
import { useUserNotifications, useCreateReminderNotification } from "@/hooks/useUserNotifications";
import { vehicleDisplayName, type PromissoryNote, type ServiceOrder, type Vehicle, type Warranty } from "@/types";
import type { UserNotification } from "@/types";

type TipoEv = "vencimento" | "pagar" | "os" | "garantia" | "lembrete";

interface CalEvent {
  dia: number;
  tipo: TipoEv;
  titulo: string;
  valor?: string;
  oficina?: string;
  link?: string;
  notifId?: string;
  horaLabel?: string;
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultReminderDatetime(): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

function mergeReminderEvents(notifs: UserNotification[], y: number, m: number): CalEvent[] {
  const out: CalEvent[] = [];
  notifs.forEach((n) => {
    if (!n.remind_at) return;
    const due = new Date(n.remind_at);
    if (Number.isNaN(due.getTime())) return;
    if (due.getFullYear() !== y || due.getMonth() !== m) return;
    out.push({
      dia: due.getDate(),
      tipo: "lembrete",
      titulo: n.title,
      link: "/notificacoes",
      notifId: n.id,
      horaLabel: due.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
  });
  return out;
}

export function CalendarioHub() {
  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tituloLembrete, setTituloLembrete] = useState("");
  const [corpoLembrete, setCorpoLembrete] = useState("");
  const [dataHoraLembrete, setDataHoraLembrete] = useState(defaultReminderDatetime);

  const { data: promData = [], isLoading: lp } = usePromissoryNotes();
  const { data: osData = [], isLoading: lo } = useServiceOrders();
  const { data: warData = [], isLoading: lw } = useWarranties();
  const { data: notifData = [], isLoading: ln } = useUserNotifications();
  const { data: payData = [], isLoading: lpay } = useOpenPayables();
  const createReminder = useCreateReminderNotification();

  const openNovoLembrete = useCallback(() => {
    setTituloLembrete("");
    setCorpoLembrete("");
    setDataHoraLembrete(defaultReminderDatetime());
    setDialogOpen(true);
  }, []);

  const openNovoLembreteNoDia = useCallback(
    (diaMes: number) => {
      const d = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), diaMes, 9, 0, 0, 0);
      setTituloLembrete("");
      setCorpoLembrete("");
      setDataHoraLembrete(toDatetimeLocalValue(d));
      setDialogOpen(true);
    },
    [mesAtual],
  );

  const eventos = useMemo(() => {
    const y = mesAtual.getFullYear();
    const m = mesAtual.getMonth();
    const out: CalEvent[] = [];

    const prom = Array.isArray(promData) ? (promData as PromissoryNote[]) : [];
    prom.forEach((p) => {
      const a = p.attributes;
      if (a.status !== "aberta") return;
      const due = new Date(String(a.due_date || ""));
      if (due.getFullYear() !== y || due.getMonth() !== m) return;
      const amount = Number(a.amount) || 0;
      const id = String(p.documentId ?? p.id);
      const cli = a.client?.data;
      const nome = cli ? cli.attributes.full_name : "Cliente";
      out.push({
        dia: due.getDate(),
        tipo: "vencimento",
        titulo: `Promissória ${nome}`,
        valor: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        link: "/financeiro?tab=receber",
      });
    });

    const orders = Array.isArray(osData) ? (osData as ServiceOrder[]) : [];
    orders.forEach((o) => {
      const a = o.attributes;
      if (!a.due_date) return;
      const due = new Date(String(a.due_date));
      if (due.getFullYear() !== y || due.getMonth() !== m) return;
      const st = String(a.status || "");
      if (st === "concluida" || st === "cancelada") return;
      const id = String(o.documentId ?? o.id);
      out.push({
        dia: due.getDate(),
        tipo: "os",
        titulo: String(a.workshop_name || "OS"),
        oficina: String(a.service_type || ""),
        link: id ? `/os/${id}` : "/os",
      });
    });

    const wars = Array.isArray(warData) ? (warData as Warranty[]) : [];
    wars.forEach((w) => {
      const a = w.attributes;
      const end = new Date(String(a.end_date || ""));
      if (end.getFullYear() !== y || end.getMonth() !== m) return;
      const st = String(a.status || "");
      if (st === "expirada" || st === "cancelada") return;
      const id = String(w.documentId ?? w.id);
      const veh = a.vehicle?.data;
      const titulo = veh ? `Garantia · ${vehicleDisplayName(veh as Vehicle)}` : "Garantia";
      out.push({
        dia: end.getDate(),
        tipo: "garantia",
        titulo,
        link: id ? `/garantias/${id}` : "/garantias",
      });
    });

    out.push(...mergeReminderEvents(Array.isArray(notifData) ? notifData : [], y, m));

    const payables = Array.isArray(payData) ? payData : [];
    payables.forEach((p) => {
      if (!p?.dueDate) return;
      const due = new Date(String(p.dueDate));
      if (Number.isNaN(due.getTime())) return;
      if (due.getFullYear() !== y || due.getMonth() !== m) return;
      if (String(p.status || "") !== "aberta") return;
      const amount = Number(p.amount) || 0;
      out.push({
        dia: due.getDate(),
        tipo: "pagar",
        titulo: `A pagar · ${String(p.description || "Conta")}`,
        valor: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        link: "/financeiro?tab=pagar",
      });
    });

    out.sort((a, b) => a.dia - b.dia || a.titulo.localeCompare(b.titulo));
    return out;
  }, [promData, osData, warData, notifData, payData, mesAtual]);

  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let i = 1; i <= ultimoDia; i++) dias.push(i);
    return dias;
  };

  const hoje = new Date();
  const isHoje = (dia: number | null) =>
    dia != null &&
    hoje.getDate() === dia &&
    hoje.getMonth() === mesAtual.getMonth() &&
    hoje.getFullYear() === mesAtual.getFullYear();

  const eventosHoje = eventos.filter((e) => isHoje(e.dia));
  const proximos = eventos
    .filter((e) => {
      const d = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), e.dia);
      const t0 = new Date();
      t0.setHours(0, 0, 0, 0);
      const t1 = new Date(t0);
      t1.setDate(t1.getDate() + 7);
      return d >= t0 && d <= t1;
    })
    .slice(0, 8);

  const loading = lp || lo || lw || ln || lpay;

  const handleSalvarLembrete = async () => {
    const t = tituloLembrete.trim();
    if (!t) return;
    const d = new Date(dataHoraLembrete);
    if (Number.isNaN(d.getTime())) return;
    await createReminder.mutateAsync({
      title: t,
      body: corpoLembrete.trim() || "",
      remindAt: d.toISOString(),
    });
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando agenda…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-[#111827]">Calendário</h1>
        <p className="text-sm text-[#6B7280]">
          Vencimentos, prazos de OS, garantias e lembretes livres (qualquer assunto), gravados na central de
          notificações
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 border border-[#E5E7EB] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize text-[#111827]">
              {mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
              <div key={dia} className="pb-2 text-center text-xs font-medium text-[#6B7280]">
                {dia}
              </div>
            ))}

            {getDiasDoMes().map((dia, index) => {
              const eventosNoDia = eventos.filter((e) => e.dia === dia);
              const ehHoje = isHoje(dia);

              return (
                <div
                  key={index}
                  className={`min-h-[100px] rounded-lg border border-[#E5E7EB] p-2 ${
                    dia ? "bg-white" : "bg-[#F9FAFB]"
                  } ${ehHoje ? "ring-2 ring-[#22C55E]" : ""}`}
                >
                  {dia != null && (
                    <>
                      <div className="mb-1 flex items-start justify-between gap-1">
                        <div className={`text-sm font-medium ${ehHoje ? "text-[#22C55E]" : "text-[#111827]"}`}>
                          {dia}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 shrink-0 px-1.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          title="Criar lembrete neste dia (notificações)"
                          aria-label={`Novo lembrete no dia ${dia}`}
                          onClick={() => openNovoLembreteNoDia(dia)}
                        >
                          + Lembrete
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {eventosNoDia.map((evento, i) => (
                          <Link
                            key={`${evento.tipo}-${evento.titulo}-${i}`}
                            href={evento.link || "#"}
                            className={`block truncate rounded p-1 text-[10px] ${
                              evento.tipo === "vencimento"
                                ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : evento.tipo === "os"
                                  ? "bg-blue-50 text-blue-800 hover:bg-blue-100"
                                  : evento.tipo === "lembrete"
                                    ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                                    : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                            }`}
                          >
                            {evento.titulo.length > 22 ? `${evento.titulo.slice(0, 22)}…` : evento.titulo}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border border-[#E5E7EB] p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-medium text-[#111827]">Hoje</h3>
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 gap-2 bg-[#22C55E] text-white hover:bg-[#16a34a]"
                onClick={openNovoLembrete}
              >
                <Bell className="h-3.5 w-3.5" aria-hidden />
                Novo lembrete
              </Button>
            </div>
            <div className="space-y-3">
              {eventosHoje.length > 0 ? (
                eventosHoje.map((evento, index) => (
                  <Link
                    key={`${evento.tipo}-${evento.notifId ?? index}`}
                    href={evento.link || "#"}
                    className="block rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3 hover:border-emerald-200"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          evento.tipo === "vencimento"
                            ? "bg-amber-500"
                            : evento.tipo === "os"
                              ? "bg-blue-500"
                              : evento.tipo === "lembrete"
                                ? "bg-emerald-500"
                                : "bg-purple-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#111827]">{evento.titulo}</div>
                        {evento.horaLabel && evento.tipo === "lembrete" && (
                          <div className="mt-1 text-xs text-[#6B7280]">Às {evento.horaLabel}</div>
                        )}
                        {evento.valor && <div className="mt-1 text-xs text-[#6B7280]">{evento.valor}</div>}
                        {evento.oficina && <div className="mt-1 text-xs text-[#6B7280]">{evento.oficina}</div>}
                      </div>
                    </div>
                    <Badge
                      className={
                        evento.tipo === "vencimento"
                          ? "border-0 bg-amber-100 text-xs text-amber-800"
                          : evento.tipo === "os"
                            ? "border-0 bg-blue-100 text-xs text-blue-800"
                            : evento.tipo === "lembrete"
                              ? "border-0 bg-emerald-100 text-xs text-emerald-900"
                              : "border-0 bg-purple-100 text-xs text-purple-800"
                      }
                    >
                      {evento.tipo === "vencimento"
                        ? "Promissória"
                        : evento.tipo === "os"
                          ? "OS"
                          : evento.tipo === "lembrete"
                            ? "Lembrete"
                            : "Garantia"}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="space-y-3 py-2 text-center">
                  <p className="text-sm text-[#6B7280]">Nenhum evento agendado para hoje neste mês.</p>
                  <Button type="button" variant="outline" className="w-full" onClick={openNovoLembrete}>
                    Criar um lembrete
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-[#E5E7EB] p-6">
            <h3 className="mb-4 text-sm font-medium text-[#111827]">Próximos 7 dias</h3>
            <div className="space-y-3">
              {proximos.length > 0 ? (
                proximos.map((evento, index) => (
                  <Link
                    key={index}
                    href={evento.link || "#"}
                    className="flex items-start gap-3 hover:opacity-80"
                  >
                    <div className="w-8 text-sm font-medium text-[#6B7280]">{evento.dia}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[#111827]">{evento.titulo}</div>
                      {evento.horaLabel && evento.tipo === "lembrete" && (
                        <div className="mt-0.5 text-xs text-[#6B7280]">{evento.horaLabel}</div>
                      )}
                      {evento.valor && <div className="mt-0.5 text-xs text-[#6B7280]">{evento.valor}</div>}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">Sem itens na janela.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md gap-4">
          <DialogHeader>
            <DialogTitle>Novo lembrete</DialogTitle>
            <DialogDescription className="text-left leading-relaxed">
              Pode ser qualquer assunto (reunião, ligação, tarefa), <strong>não precisa</strong> estar ligado a
              OS, promissória ou outro módulo. Ao confirmar, o registro vai para{" "}
              <Link href="/notificacoes" className="font-medium text-emerald-800 underline underline-offset-2">
                Notificações
              </Link>{" "}
              e para este calendário na data e hora definidas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="lembrete-titulo">Título</Label>
              <Input
                id="lembrete-titulo"
                placeholder="Ex.: Ligar para o fornecedor"
                value={tituloLembrete}
                onChange={(e) => setTituloLembrete(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lembrete-corpo">Descrição (opcional)</Label>
              <Textarea
                id="lembrete-corpo"
                placeholder="Detalhes ou observações…"
                value={corpoLembrete}
                onChange={(e) => setCorpoLembrete(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lembrete-data">Data e hora</Label>
              <Input
                id="lembrete-data"
                type="datetime-local"
                value={dataHoraLembrete}
                onChange={(e) => setDataHoraLembrete(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 sm:justify-end">
            <Button type="button" variant="outline" className="h-10 min-w-[6rem]" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-10 min-w-[8rem] bg-[#22C55E] hover:bg-[#16a34a]"
              disabled={!tituloLembrete.trim() || createReminder.isPending}
              onClick={() => void handleSalvarLembrete()}
            >
              {createReminder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                "Confirmar lembrete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
