import type { PrismaClient } from "@prisma/client";
import { dec, materialBelowMinimum } from "@/lib/materials/stockMovement";
import { materialAlertLink } from "@/lib/materials/minStockAlert";
import { listCommitmentsInPreWindow } from "@/lib/inbox/commitmentWindow";

const ERP_ID = 1;

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  if (n < min || n > max) return fallback;
  return Math.trunc(n);
}

export type InboxVirtualAlert = {
  kind: "documentos";
  title: string;
  body: string;
  href: string;
  count: number;
};

export type InboxMaterialLowStockItem = {
  materialId: number;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  href: string;
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
  materialLowStock: {
    openCount: number;
    items: InboxMaterialLowStockItem[];
  };
  virtualAlerts: InboxVirtualAlert[];
  commitmentsInPreWindow: { id: string; title: string; remindAt: string }[];
  totalActionable: number;
};

async function loadMaterialLowStock(
  prisma: PrismaClient,
  role: string | undefined,
): Promise<{ openCount: number; items: InboxMaterialLowStockItem[] }> {
  if (role !== "admin" && role !== "producao") {
    return { openCount: 0, items: [] };
  }

  const materials = await prisma.material.findMany({
    orderBy: { sku: "asc" },
    take: 500,
    select: { id: true, sku: true, name: true, currentStock: true, minStock: true },
  });

  const belowMin = materials.filter((m) => materialBelowMinimum(m));
  return {
    openCount: belowMin.length,
    items: belowMin.slice(0, 8).map((m) => ({
      materialId: m.id,
      sku: m.sku,
      name: m.name,
      currentStock: dec(m.currentStock),
      minStock: dec(m.minStock),
      href: materialAlertLink(m.id),
    })),
  };
}

export async function buildInboxSummary(
  prisma: PrismaClient,
  params: { userId: number; role: string | undefined },
): Promise<InboxSummaryPayload> {
  const now = new Date();
  const { userId, role } = params;

  const notifWhere = role === "admin" ? {} : { ownerUserId: userId };

  const [erp, userRow, unreadCount, notifPreviews, materialLowStock, docsPending, allUnreadForWindow] =
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
      loadMaterialLowStock(prisma, role),
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
  const materialOpenCount = materialLowStock.openCount;

  const virtualAlerts: InboxVirtualAlert[] = [];
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
  const totalActionable = unreadCount + materialOpenCount + virtualSum;

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
    materialLowStock,
    virtualAlerts,
    commitmentsInPreWindow,
    totalActionable,
  };
}
