import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { promissoryNoteCreateSchema } from "@/lib/zodSchemas";
import { staffRoles } from "@/lib/apiRoles";
import { parseDateInput, parseOptionalDate } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const GET = withRole(staffRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const clientId = searchParams.get("clientId");
  const vehicleId = searchParams.get("vehicleId");
  const statusFilter = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const parts: Prisma.PromissoryNoteWhereInput[] = [];
  if (clientId && Number.isFinite(Number(clientId))) {
    parts.push({ clientId: Number(clientId) });
  }
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    parts.push({ vehicleId: Number(vehicleId) });
  }

  const today = startOfToday();
  if (statusFilter === "vencida") {
    parts.push({
      OR: [{ status: "vencida" }, { status: "aberta", dueDate: { lt: today } }],
    });
  } else if (statusFilter === "aberta") {
    parts.push({ status: "aberta", dueDate: { gte: today } });
  } else if (statusFilter === "paga" || statusFilter === "cancelada") {
    parts.push({ status: statusFilter });
  }

  if (q) {
    parts.push({
      OR: [
        { client: { fullName: { contains: q, mode: "insensitive" } } },
        { client: { document: { contains: q, mode: "insensitive" } } },
        { vehicle: { brand: { contains: q, mode: "insensitive" } } },
        { vehicle: { model: { contains: q, mode: "insensitive" } } },
        { vehicle: { plate: { contains: q, mode: "insensitive" } } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.PromissoryNoteWhereInput =
    parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

  const [total, data] = await prisma.$transaction([
    prisma.promissoryNote.count({ where }),
    prisma.promissoryNote.findMany({
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
  const parsed = promissoryNoteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.promissoryNote.create({
    data: {
      documentId: d.documentId,
      installmentNumber: d.installmentNumber,
      totalInstallments: d.totalInstallments,
      dueDate: parseDateInput(d.dueDate),
      amount: d.amount,
      status: d.status,
      paymentDate: parseOptionalDate(d.paymentDate ?? undefined),
      notes: d.notes,
      clientId: d.clientId,
      vehicleId: d.vehicleId,
    },
  });
  return ok(created, { status: 201 });
});
