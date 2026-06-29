import type { NextRequest } from "next/server";
import { allStaffReadRoles, financeWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Dispatcher idempotente: cria UserNotification de "vencimento" quando
 * o item financeiro está a N dias do vencimento.
 *
 * Execução: chamar via cron/worker externo, ou manualmente por admin.
 * Multitenant: escopado ao tenant do chamador (db escopado + erpSetting/users por tenant).
 */
export const POST = withRole(financeWriteRoles, async (_req: NextRequest) => {
  const today = startOfToday();
  const erp = await prisma.erpSetting.findUnique({ where: { id: 1 } });
  const defaultDays = Math.max(0, Math.min(30, Number(erp?.financeEventNotifyDaysBefore ?? 1)));

  const users = await prisma.user.findMany({
    where: { role: { in: ["admin", "financeiro"] } },
    select: { id: true, financeEventNotifyDaysBeforeOverride: true },
  });

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    const eff = u.financeEventNotifyDaysBeforeOverride ?? defaultDays;
    const daysBefore = Math.max(0, Math.min(30, Number(eff)));
    const targetDue = addDays(today, daysBefore);

    const [proms, pays] = await Promise.all([
      prisma.promissoryNote.findMany({
        where: { status: "aberta", dueDate: targetDue },
        select: { id: true, dueDate: true, amount: true, installmentNumber: true, totalInstallments: true },
      }),
      prisma.payable.findMany({
        where: { status: "aberta", dueDate: targetDue },
        select: { id: true, dueDate: true, amount: true, description: true },
      }),
    ]);

    for (const p of proms) {
      try {
        await prisma.financeNotificationDispatch.create({
          data: {
            eventType: "promissory_note_due",
            eventId: p.id,
            ownerUserId: u.id,
            scheduledFor: today,
            sentAt: new Date(),
          },
        });
        await prisma.userNotification.create({
          data: {
            title: daysBefore === 0 ? "Vencimento hoje (A Receber)" : `Vencimento em ${daysBefore} dia(s) (A Receber)`,
            body: `Parcela ${p.installmentNumber}/${p.totalInstallments} vence em ${p.dueDate.toLocaleDateString("pt-BR")}.`,
            read: false,
            link: "/financeiro?tab=receber",
            ownerUserId: u.id,
          },
        });
        created += 1;
      } catch {
        skipped += 1;
      }
    }

    for (const pay of pays) {
      try {
        await prisma.financeNotificationDispatch.create({
          data: {
            eventType: "payable_due",
            eventId: pay.id,
            ownerUserId: u.id,
            scheduledFor: today,
            sentAt: new Date(),
          },
        });
        await prisma.userNotification.create({
          data: {
            title: daysBefore === 0 ? "Vencimento hoje (A Pagar)" : `Vencimento em ${daysBefore} dia(s) (A Pagar)`,
            body: `${String(pay.description || "Conta")} vence em ${pay.dueDate.toLocaleDateString("pt-BR")}.`,
            read: false,
            link: "/financeiro?tab=pagar",
            ownerUserId: u.id,
          },
        });
        created += 1;
      } catch {
        skipped += 1;
      }
    }
  }

  return ok({ created, skipped, defaultDays });
});
