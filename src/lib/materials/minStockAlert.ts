import { prisma } from "@/lib/db";
import { dec, materialBelowMinimum } from "@/lib/materials/stockMovement";

const ALERT_LINK_PREFIX = "/estoque/materiais?highlight=";

export function materialAlertLink(materialId: number): string {
  return `${ALERT_LINK_PREFIX}${materialId}`;
}

/**
 * Notifica admin e produção quando material fica abaixo do mínimo.
 * Idempotente: não duplica notificação não lida com o mesmo link.
 */
export async function dispatchMinStockAlerts(materialId: number): Promise<number> {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, sku: true, name: true, currentStock: true, minStock: true },
  });
  if (!material || !materialBelowMinimum(material)) {
    return 0;
  }

  const recipients = await prisma.user.findMany({
    where: { role: { in: ["admin", "producao"] }, isActive: true },
    select: { id: true },
  });

  const link = materialAlertLink(material.id);
  const title = "Material abaixo do estoque mínimo";
  const body = `${material.name} (${material.sku}): saldo ${dec(material.currentStock)} abaixo do mínimo ${dec(material.minStock)}.`;

  let created = 0;
  for (const user of recipients) {
    const existing = await prisma.userNotification.findFirst({
      where: { ownerUserId: user.id, link, read: false },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.userNotification.create({
      data: {
        title,
        body,
        read: false,
        link,
        ownerUserId: user.id,
      },
    });
    created += 1;
  }

  return created;
}
