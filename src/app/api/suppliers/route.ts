import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { supplierCreateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "1") {
    const data = await prisma.supplier.findMany({ orderBy: { id: "desc" }, take: 500 });
    return ok(data);
  }
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q");

  const where: Prisma.SupplierWhereInput = {};
  if (q) {
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { document: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(staffRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = supplierCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.supplier.create({
    data: {
      documentId: d.documentId,
      companyName: d.companyName,
      document: d.document,
      phone: d.phone,
      email: d.email === "" ? undefined : d.email,
      notes: d.notes,
      zipCode: d.zipCode,
      neighborhood: d.neighborhood,
      street: d.street,
      city: d.city,
      streetNumber: d.streetNumber,
      addressComplement: d.addressComplement,
    },
  });
  return ok(created, { status: 201 });
});
