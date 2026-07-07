import type { UserNotification } from "@/types";

export type TipoEv = "pagar" | "lembrete";

export interface CalEvent {
  dia: number;
  tipo: TipoEv;
  titulo: string;
  valor?: string;
  link?: string;
  notifId?: string;
  horaLabel?: string;
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

export function buildCalendarMonthEvents(args: {
  payData: unknown;
  notifData: unknown;
  monthAnchor: Date;
}): CalEvent[] {
  const { payData, notifData, monthAnchor } = args;
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
  const out: CalEvent[] = [];

  const payables = Array.isArray(payData) ? payData : [];
  payables.forEach((p) => {
    const row = p as { dueDate?: string | Date; status?: string; amount?: unknown; description?: string };
    if (!row?.dueDate) return;
    const due = new Date(String(row.dueDate));
    if (Number.isNaN(due.getTime())) return;
    if (due.getFullYear() !== y || due.getMonth() !== m) return;
    if (String(row.status || "") !== "aberta") return;
    const amount = Number(row.amount) || 0;
    out.push({
      dia: due.getDate(),
      tipo: "pagar",
      titulo: `A pagar · ${String(row.description || "Conta")}`,
      valor: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      link: "/financeiro",
    });
  });

  out.push(...mergeReminderEvents(Array.isArray(notifData) ? (notifData as UserNotification[]) : [], y, m));

  out.sort((a, b) => a.dia - b.dia || a.titulo.localeCompare(b.titulo));
  return out;
}

export function selectUpcomingWindow(args: { events: CalEvent[]; monthAnchor: Date; daysAhead: number; limit: number }): CalEvent[] {
  const { events, monthAnchor, daysAhead, limit } = args;
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const t1 = new Date(t0);
  t1.setDate(t1.getDate() + daysAhead);

  return events
    .filter((e) => {
      const d = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), e.dia);
      return d >= t0 && d <= t1;
    })
    .slice(0, limit);
}
