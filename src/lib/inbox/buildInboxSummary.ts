import type { PrismaClient } from "@prisma/client";
import { loadPontosAtencaoCore } from "@/lib/dashboard/pontosAtencaoCore";
import type { DashboardPontosAtencaoItem } from "@/lib/dashboard/summaryTypes";
import { listCommitmentsInPreWindow } from "@/lib/inbox/commitmentWindow";

const ERP_ID = 1;

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  if (n < min || n > max) return fallback;
  return Math.trunc(n);
}

function diasParado(createdAt: Date, now: Date): number {
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

export type InboxVirtualAlert = {
  kind: "giro" | "promissora" | "documentos";
  title: string;
  body: string;
  href: string;
  count: number;
};

export type InboxSummaryPayload = {
  showDashboardAttentionStripe: boolean;
  preEventPopupMinutes: number;
  notificationsUnread: number;
  notificationPreviews: {
    id: string;
    title: string;
    body: string;
    link: string | null;
    remindAt: string | null;
    createdAt: string;
  }[];
  stockAttention: {
    diasMin: number;
    openCount: number;
    items: DashboardPontosAtencaoItem[];
  };
  virtualAlerts: InboxVirtualAlert[];
  commitmentsInPreWindow: { id: string; title: string; remindAt: string }[];
  totalActionable: number;
};

export async function buildInboxSummary(
  prisma: PrismaClient,
  params: { userId: number; role: string | undefined },
): Promise<InboxSummaryPayload> {
  const now = new Date();
  const { userId, role } = params;

  const notifWhere = role === "admin" ? {} : { ownerUserId: userId };

  const [erp, userRow, unreadCount, notifPreviews, pontosBlock, stockPrefs, giroVehicles, docsPending, allUnreadForWindow] =
    await Promise.all([
      prisma.erpSetting.findUnique({ where: { id: ERP_ID } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { showDashboardAttentionStripe: true },
      }),
      prisma.userNotification.count({ where: { ...notifWhere, read: false } }),
      prisma.userNotification.findMany({
        where: { ...notifWhere, read: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, title: true, body: true, link: true, remindAt: true, createdAt: true, read: true },
      }),
      loadPontosAtencaoCore(prisma, now),
      prisma.userStockAttentionPreference.findMany({ where: { userId } }),
      prisma.vehicle.findMany({
        where: { status: { in: ["disponivel", "reservado"] } },
        select: { id: true, createdAt: true },
        take: 5000,
      }),
      prisma.clientDocument.count({
        where: { documentFileUrl: null, externalUrl: null },
      }),
      prisma.userNotification.findMany({
        where: { ...notifWhere, read: false },
        select: { id: true, read: true, remindAt: true, title: true },
      }),
    ]);

  const preRaw = erp?.inboxPreEventPopupMinutes ?? 30;
  const preEventPopupMinutes = clampInt(preRaw, 1, 1440, 30);

  const showStripe = userRow?.showDashboardAttentionStripe ?? true;

  const prefByVehicle = new Map(stockPrefs.map((p) => [p.vehicleId, p]));
  const stockItemsFiltered = pontosBlock.pontosAtencaoFull.filter((item) => {
    const p = prefByVehicle.get(item.vehicleId);
    if (!p) return true;
    if (p.dismissed) return false;
    if (p.snoozedUntil && p.snoozedUntil > now) return false;
    return true;
  });
  const stockOpenCount = stockItemsFiltered.length;
  const stockPreview = stockItemsFiltered.slice(0, 8);

  const warnDays = erp?.alertGiroWarnDays ?? 30;
  const critDays = erp?.alertGiroCritDays ?? 45;
  let giroAction = 0;
  if (erp?.alertGiroEnabled) {
    for (const v of giroVehicles) {
      const d = diasParado(v.createdAt, now);
      if (d >= warnDays) giroAction += 1;
    }
  }

  let promCount = 0;
  if (erp?.alertPromEnabled) {
    const daysBefore = erp.alertPromDaysBefore ?? 7;
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() + daysBefore);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    promCount = await prisma.promissoryNote.count({
      where: {
        status: { in: ["aberta", "vencida"] },
        dueDate: { gte: start, lte: end },
      },
    });
  }

  const virtualAlerts: InboxVirtualAlert[] = [];
  if (erp?.alertGiroEnabled && giroAction > 0) {
    virtualAlerts.push({
      kind: "giro",
      title: "Análise de giro",
      body: `${giroAction} veículo(s) em disponível ou reservado acima dos limiares de atenção configurados.`,
      href: "/giro",
      count: giroAction,
    });
  }
  if (erp?.alertPromEnabled && promCount > 0) {
    virtualAlerts.push({
      kind: "promissora",
      title: "Promissórias",
      body: `${promCount} parcela(s) com vencimento no período configurado.`,
      href: "/financeiro?tab=receber",
      count: promCount,
    });
  }
  if (erp?.alertDocsEnabled && docsPending > 0) {
    virtualAlerts.push({
      kind: "documentos",
      title: "Documentos de clientes",
      body: `${docsPending} registro(s) sem arquivo ou link externo.`,
      href: "/documentos",
      count: docsPending,
    });
  }

  const commitmentsInPreWindow = listCommitmentsInPreWindow(now, preEventPopupMinutes, allUnreadForWindow);

  const virtualSum = virtualAlerts.reduce((s, v) => s + Math.min(v.count, 99), 0);
  const totalActionable = unreadCount + stockOpenCount + virtualSum;

  return {
    showDashboardAttentionStripe: showStripe,
    preEventPopupMinutes,
    notificationsUnread: unreadCount,
    notificationPreviews: notifPreviews.map((n) => ({
      id: String(n.id),
      title: n.title,
      body: n.body,
      link: n.link,
      remindAt: n.remindAt ? n.remindAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    })),
    stockAttention: {
      diasMin: pontosBlock.diasMin,
      openCount: stockOpenCount,
      items: stockPreview,
    },
    virtualAlerts,
    commitmentsInPreWindow,
    totalActionable,
  };
}
