import type { NextRequest } from "next/server";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { prisma } from "@/lib/db";
import { withRole } from "@/lib/withRole";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [totalClients, clientsNewThisMonth, activeQuoteGroups, totalSuppliers] = await prisma.$transaction([
    prisma.client.count(),
    prisma.client.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.quote.groupBy({
      by: ["clientId"],
      where: { createdAt: { gte: sixMonthsAgo } },
      orderBy: { clientId: "asc" },
    }),
    prisma.supplier.count(),
  ]);

  return ok({
    totalClients,
    clientsNewThisMonth,
    clientsActiveLast6Months: activeQuoteGroups.length,
    totalSuppliers,
  });
});
