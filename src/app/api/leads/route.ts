import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

/**
 * GET /api/leads — leads da vitrine do tenant (cycle 0618). Staff, tenant-scoped.
 * Query: `page`, `pageSize`, `unread=1` (apenas não lidos).
 */
export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);

  const where: Prisma.StorefrontLeadWhereInput = {};
  if (searchParams.get("unread") === "1") {
    where.readAt = null;
  }

  const [total, data] = await prisma.$transaction([
    prisma.storefrontLead.count({ where }),
    prisma.storefrontLead.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true } },
      },
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});
