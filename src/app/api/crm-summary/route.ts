import type { NextRequest } from "next/server";
import { staffRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (_req: NextRequest) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [totalClients, clientsNewThisMonth, activeSaleGroups, totalSuppliers] = await prisma.$transaction([
    prisma.client.count(),
    prisma.client.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.sale.groupBy({
      by: ["clientId"],
      where: { saleDate: { gte: sixMonthsAgo } },
      orderBy: { clientId: "asc" },
    }),
    prisma.supplier.count(),
  ]);

  return ok({
    totalClients,
    clientsNewThisMonth,
    clientsActiveLast6Months: activeSaleGroups.length,
    totalSuppliers,
  });
});
