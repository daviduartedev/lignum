import { prisma } from "@/lib/db";
import { productionOrderDisplayNumber } from "@/lib/productionOrderLabels";

export type EmployeeProductivityDto = {
  employeeId: number;
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
  recentCompleted: Array<{
    productionOrderId: number;
    orderNumber: string;
    clientName: string;
    bodyModelName?: string | null;
    completedAt: string;
  }>;
};

export async function getEmployeeProductivity(employeeId: number): Promise<EmployeeProductivityDto | null> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
  if (!employee) return null;

  const links = await prisma.productionOrderEmployee.findMany({
    where: { employeeId },
    include: {
      productionOrder: {
        include: {
          quote: {
            select: {
              client: { select: { fullName: true } },
              bodyModel: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const completed = links.filter((l) => l.productionOrder.status === "concluida");
  const inProgress = links.filter((l) => l.productionOrder.status === "andamento");

  const recentCompleted = completed
    .filter((l) => l.productionOrder.completedAt)
    .sort(
      (a, b) =>
        (b.productionOrder.completedAt?.getTime() ?? 0) -
        (a.productionOrder.completedAt?.getTime() ?? 0),
    )
    .slice(0, 8)
    .map((l) => ({
      productionOrderId: l.productionOrder.id,
      orderNumber: productionOrderDisplayNumber(l.productionOrder),
      clientName: l.productionOrder.quote.client.fullName,
      bodyModelName: l.productionOrder.quote.bodyModel?.name ?? null,
      completedAt: l.productionOrder.completedAt!.toISOString(),
    }));

  return {
    employeeId,
    totalAssigned: links.length,
    completedCount: completed.length,
    inProgressCount: inProgress.length,
    recentCompleted,
  };
}

/** Contagem de OPs por funcionário (para listagem). */
export async function countEmployeeProductionLinks(
  employeeIds: number[],
): Promise<Map<number, { total: number; completed: number }>> {
  const map = new Map<number, { total: number; completed: number }>();
  if (employeeIds.length === 0) return map;

  const rows = await prisma.productionOrderEmployee.findMany({
    where: { employeeId: { in: employeeIds } },
    include: { productionOrder: { select: { status: true } } },
  });

  for (const row of rows) {
    const prev = map.get(row.employeeId) ?? { total: 0, completed: 0 };
    prev.total += 1;
    if (row.productionOrder.status === "concluida") prev.completed += 1;
    map.set(row.employeeId, prev);
  }
  return map;
}
