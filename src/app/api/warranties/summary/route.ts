import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest) => {
  const rows = await prisma.warranty.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
  return ok({
    ativas: byStatus.ativa ?? 0,
    vencendo: byStatus.vencendo ?? 0,
    expiradas: byStatus.expirada ?? 0,
    canceladas: byStatus.cancelada ?? 0,
  });
});
