import type { Prisma } from "@prisma/client";
import { ServiceOrderStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { serviceOrderCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";
import { parseDateInput, parseOptionalDate } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const vehicleId = searchParams.get("vehicleId");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const parts: Prisma.ServiceOrderWhereInput[] = [];
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    parts.push({ vehicleId: Number(vehicleId) });
  }
  if (status && (Object.values(ServiceOrderStatus) as string[]).includes(status)) {
    parts.push({ status: status as ServiceOrderStatus });
  }
  if (q) {
    parts.push({
      OR: [
        { workshopName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { serviceTypeOtherText: { contains: q, mode: "insensitive" } },
        { responsible: { contains: q, mode: "insensitive" } },
        { vehicle: { brand: { contains: q, mode: "insensitive" } } },
        { vehicle: { model: { contains: q, mode: "insensitive" } } },
        { vehicle: { plate: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.ServiceOrderWhereInput =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

  const [total, data] = await prisma.$transaction([
    prisma.serviceOrder.count({ where }),
    prisma.serviceOrder.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(productionWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = serviceOrderCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.serviceOrder.create({
    data: {
      documentId: d.documentId,
      workshopName: d.workshopName,
      serviceType: d.serviceType,
      serviceTypeOtherText: d.serviceType === "outros" ? d.serviceTypeOtherText?.trim() : null,
      status: d.status,
      entryDate: parseDateInput(d.entryDate),
      dueDate: parseOptionalDate(d.dueDate ?? undefined),
      responsible: d.responsible,
      description: d.description,
      partsJson: d.partsJson ?? undefined,
      laborJson: d.laborJson ?? undefined,
      totalAmount: d.totalAmount,
      photoUrls: d.photoUrls ?? [],
      vehicleId: d.vehicleId,
    },
  });
  return ok(created, { status: 201 });
});
