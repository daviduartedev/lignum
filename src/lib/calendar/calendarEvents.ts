import { vehicleDisplayName, type PromissoryNote, type ServiceOrder, type Vehicle, type Warranty } from "@/types";
import type { UserNotification } from "@/types";

export type TipoEv = "vencimento" | "os" | "garantia" | "lembrete";

export interface CalEvent {
  dia: number;
  tipo: TipoEv;
  titulo: string;
  valor?: string;
  oficina?: string;
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
  promData: unknown;
  osData: unknown;
  warData: unknown;
  notifData: unknown;
  monthAnchor: Date;
}): CalEvent[] {
  const { promData, osData, warData, notifData, monthAnchor } = args;
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
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
      link: id ? `/promissorias/${id}` : "/promissorias",
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

