import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { materialCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { materialBelowMinimum } from "@/lib/materials/stockMovement";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const materialInclude = { supplier: { select: { id: true, companyName: true } } } as const;

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const belowMinimum = searchParams.get("belowMinimum") === "1";
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  if (searchParams.get("all") === "1") {
    const where: Prisma.MaterialWhereInput = {};
    if (category) where.category = category as Prisma.EnumMaterialCategoryFilter["equals"];
    if (q) {
      where.OR = [
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }
    let rows = await prisma.material.findMany({
      where,
      orderBy: { sku: "asc" },
      take: 500,
      include: materialInclude,
    });
    if (belowMinimum) rows = rows.filter((m) => materialBelowMinimum(m));
    return ok(rows);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const where: Prisma.MaterialWhereInput = {};
  if (category) where.category = category as Prisma.EnumMaterialCategoryFilter["equals"];
  if (q) {
    where.OR = [
      { sku: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (belowMinimum) {
    const all = await prisma.material.findMany({ where, orderBy: { sku: "asc" }, include: materialInclude });
    const filtered = all.filter((m) => materialBelowMinimum(m));
    const total = filtered.length;
    const data = filtered.slice(skip, skip + take);
    return ok(data, {}, paginationMeta(total, page, pageSize));
  }

  const [total, data] = await prisma.$transaction([
    prisma.material.count({ where }),
    prisma.material.findMany({
      where,
      orderBy: { sku: "asc" },
      skip,
      take,
      include: materialInclude,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(productionWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = materialCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const d = parsed.data;
  try {
    const created = await prisma.material.create({
      data: {
        documentId: d.documentId,
        sku: d.sku.toUpperCase(),
        name: d.name,
        category: d.category,
        unit: d.unit,
        minStock: d.minStock ?? 0,
        avgCost: d.avgCost ?? 0,
        currentStock: 0,
        supplier: d.supplierId ? { connect: { id: d.supplierId } } : undefined,
      },
      include: materialInclude,
    });
    return ok(created, { status: 201 });
  } catch {
    return fail("CONFLICT", 409, { message: "Já existe um material com este SKU." });
  }
});
