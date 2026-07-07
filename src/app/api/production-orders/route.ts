import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { ok, fail } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { productionOrderInclude } from "@/lib/production/orderTransitions";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "1") {
    const status = searchParams.get("status");
    const where: Prisma.ProductionOrderWhereInput = {};
    if (status) {
      where.status = status as Prisma.EnumProductionOrderStatusFilter["equals"];
    }
    const data = await prisma.productionOrder.findMany({
      where,
      orderBy: { id: "desc" },
      take: 500,
      include: productionOrderInclude,
    });
    return ok(data);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");

  const where: Prisma.ProductionOrderWhereInput = {};
  if (status) {
    where.status = status as Prisma.EnumProductionOrderStatusFilter["equals"];
  }
  if (q) {
    const employeeId = /^\d+$/.test(q) ? Number(q) : null;
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { quote: { quoteNumber: { contains: q, mode: "insensitive" } } },
      { quote: { client: { fullName: { contains: q, mode: "insensitive" } } } },
      ...(employeeId != null ? [{ employees: { some: { employeeId } } }] : []),
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.productionOrder.count({ where }),
    prisma.productionOrder.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
      include: productionOrderInclude,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

/** OP avulsa fora do MVP — criada apenas via conversão de orçamento. */
export const POST = withRole(productionWriteRoles, async () => {
  return fail("BAD_REQUEST", 400, {
    message: "Ordem de produção é criada automaticamente ao converter um orçamento aprovado.",
  });
});
