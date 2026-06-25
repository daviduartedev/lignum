import type { Prisma, WarrantyStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { warrantyCreateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const clientId = searchParams.get("clientId");
  const vehicleId = searchParams.get("vehicleId");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const parts: Prisma.WarrantyWhereInput[] = [];
  if (clientId && Number.isFinite(Number(clientId))) {
    parts.push({ clientId: Number(clientId) });
  }
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    parts.push({ vehicleId: Number(vehicleId) });
  }
  if (status && ["ativa", "vencendo", "expirada", "cancelada"].includes(status)) {
    parts.push({ status: status as WarrantyStatus });
  }
  if (q) {
    parts.push({
      OR: [
        { client: { fullName: { contains: q, mode: "insensitive" } } },
        { client: { document: { contains: q, mode: "insensitive" } } },
        { vehicle: { brand: { contains: q, mode: "insensitive" } } },
        { vehicle: { model: { contains: q, mode: "insensitive" } } },
        { vehicle: { plate: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.WarrantyWhereInput =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

  const [total, data] = await prisma.$transaction([
    prisma.warranty.count({ where }),
    prisma.warranty.findMany({
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
  const parsed = warrantyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.warranty.create({
    data: {
      documentId: d.documentId,
      warrantyType: d.warrantyType,
      startDate: parseDateInput(d.startDate),
      endDate: parseDateInput(d.endDate),
      coverageValue: d.coverageValue,
      status: d.status,
      notes: d.notes,
      vehicleId: d.vehicleId,
      clientId: d.clientId,
    },
  });
  return ok(created, { status: 201 });
});
