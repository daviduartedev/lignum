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
import { useOpenPayables } from "@/hooks/usePayables";
import { useUserNotifications, useCreateReminderNotification } from "@/hooks/useUserNotifications";
import type { UserNotification } from "@/types";

type TipoEv = "pagar" | "lembrete";

interface CalEvent {
  dia: number;
  tipo: TipoEv;
  titulo: string;
  valor?: string;
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
        link: "/financeiro",
      });
    });

    out.sort((a, b) => a.dia - b.dia || a.titulo.localeCompare(b.titulo));
    return out;
  }, [notifData, payData, mesAtual]);

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

  const loading = ln || lpay;

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
          Vencimentos de contas a pagar e lembretes livres gravados na central de notificações
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
                          className="h-6 shrink-0 px-1.5 text-[10px] font-medium text-primary hover:bg-secondary hover:text-accent"
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
                              evento.tipo === "pagar"
                                ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-900 hover:bg-secondary"
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
                className="h-9 shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-accent"
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
                          evento.tipo === "pagar" ? "bg-amber-500" : "bg-primary"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#111827]">{evento.titulo}</div>
                        {evento.horaLabel && evento.tipo === "lembrete" && (
                          <div className="mt-1 text-xs text-[#6B7280]">Às {evento.horaLabel}</div>
                        )}
                        {evento.valor && <div className="mt-1 text-xs text-[#6B7280]">{evento.valor}</div>}
                      </div>
                    </div>
                    <Badge
                      className={
                        evento.tipo === "pagar"
                          ? "border-0 bg-amber-100 text-xs text-amber-800"
                          : "border-0 bg-emerald-100 text-xs text-emerald-900"
                      }
                    >
                      {evento.tipo === "pagar" ? "A pagar" : "Lembrete"}
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
              Pode ser qualquer assunto (reunião, ligação, tarefa). Ao confirmar, o registro vai para{" "}
              <Link href="/notificacoes" className="font-medium text-primary underline underline-offset-2">
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
              className="h-10 min-w-[8rem] bg-primary hover:bg-accent"
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
