import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { employeeCreateSchema } from "@/lib/zodSchemas";
import { adminOnlyRoles, allStaffReadRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { countEmployeeProductionLinks } from "@/lib/employees/productivity";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const employeeInclude = {
  user: { select: { id: true, name: true, email: true } },
} as const;

async function enrichWithCounts(rows: Array<Record<string, unknown>>) {
  const ids = rows.map((r) => Number(r.id));
  const counts = await countEmployeeProductionLinks(ids);
  return rows.map((r) => {
    const c = counts.get(Number(r.id));
    return {
      ...r,
      assignedOrdersCount: c?.total ?? 0,
      completedOrdersCount: c?.completed ?? 0,
    };
  });
}

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  if (searchParams.get("all") === "1") {
    const activeParam = searchParams.get("active");
    const where: Prisma.EmployeeWhereInput = {};
    if (activeParam === "1") where.isActive = true;
    if (activeParam === "0") where.isActive = false;
    const rows = await prisma.employee.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: 500,
      include: employeeInclude,
    });
    const enriched = await enrichWithCounts(rows as unknown as Array<Record<string, unknown>>);
    return ok(enriched);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim();
  const activeParam = searchParams.get("active");
  const where: Prisma.EmployeeWhereInput = {};
  if (activeParam === "1") where.isActive = true;
  if (activeParam === "0") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { roleTitle: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip,
      take,
      include: employeeInclude,
    }),
  ]);

  const enriched = await enrichWithCounts(rows as unknown as Array<Record<string, unknown>>);
  return ok(enriched, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(adminOnlyRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = employeeCreateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const d = parsed.data;
  const created = await prisma.employee.create({
    data: {
      documentId: d.documentId,
      name: d.name,
      roleTitle: d.roleTitle,
      commissionPct: d.commissionPct ?? undefined,
      isActive: d.isActive ?? true,
      ...(d.userId ? { user: { connect: { id: d.userId } } } : {}),
    },
    include: employeeInclude,
  });
  return ok(created, { status: 201 });
});
