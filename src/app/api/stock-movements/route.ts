import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { stockMovementCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { recordStockMovement, stockErrorToResponse } from "@/lib/materials/stockMovement";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const movementInclude = {
  material: { include: { supplier: { select: { id: true, companyName: true } } } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get("materialId");
  const { skip, take, page, pageSize } = parsePagination(searchParams);

  const where: Prisma.StockMovementWhereInput = {};
  if (materialId) {
    const id = Number(materialId);
    if (!Number.isInteger(id) || id <= 0) {
      return fail("BAD_REQUEST", 400, { message: "materialId inválido." });
    }
    where.materialId = id;
  }

  const [total, data] = await prisma.$transaction([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: movementInclude,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(productionWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = stockMovementCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : undefined;
  const d = parsed.data;

  try {
    const result = await recordStockMovement({
      materialId: d.materialId,
      type: d.type,
      quantity: Number(d.quantity),
      unitCost: d.unitCost != null ? Number(d.unitCost) : undefined,
      notes: d.notes,
      createdByUserId: Number.isInteger(userId) && userId! > 0 ? userId : undefined,
    });
    return ok(result, { status: 201 });
  } catch (err) {
    const mapped = stockErrorToResponse(err);
    if (mapped) return mapped;
    throw err;
  }
});
