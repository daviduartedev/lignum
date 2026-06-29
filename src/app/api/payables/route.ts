import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { payableCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, financeWriteRoles } from "@/lib/apiRoles";
import { parseDateInput, parseOptionalDate } from "@/lib/dates";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addMonthsClamped(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const statusFilter = searchParams.get("status");
  const origin = searchParams.get("origin");
  const vehicleId = searchParams.get("vehicleId");
  const supplierId = searchParams.get("supplierId");
  const q = searchParams.get("q")?.trim();

  const parts: Prisma.PayableWhereInput[] = [];

  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    parts.push({ vehicleId: Number(vehicleId) });
  }
  if (supplierId && Number.isFinite(Number(supplierId))) {
    parts.push({ supplierId: Number(supplierId) });
  }
  if (origin) {
    parts.push({ origin: origin as Prisma.PayableWhereInput["origin"] });
  }

  const today = startOfToday();
  if (statusFilter === "vencida") {
    parts.push({ OR: [{ status: "vencida" }, { status: "aberta", dueDate: { lt: today } }] });
  } else if (statusFilter === "aberta") {
    parts.push({ status: "aberta", dueDate: { gte: today } });
  } else if (statusFilter === "paga" || statusFilter === "cancelada") {
    parts.push({ status: statusFilter });
  }

  if (q) {
    parts.push({
      OR: [{ description: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }],
    });
  }

  const where: Prisma.PayableWhereInput = parts.length === 0 ? {} : parts.length === 1 ? parts[0]! : { AND: parts };

  const [total, data] = await prisma.$transaction([
    prisma.payable.count({ where }),
    prisma.payable.findMany({ where, orderBy: { id: "desc" }, skip, take }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(financeWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = payableCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;

  if (d.installmentPlan) {
    const plan = d.installmentPlan;
    const n = plan.totalInstallments;
    const base = parseDateInput(plan.firstDueDate);
    const amount = plan.installmentAmount;
    const interval = plan.intervalMonths;
    const desc = (d.description ?? "").trim();

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (let i = 0; i < n; i++) {
        const due = addMonthsClamped(base, i * interval);
        const installmentDesc = n > 1 ? `${desc || "Despesa"} (${i + 1}/${n})` : desc || "Despesa";
        const row = await tx.payable.create({
          data: {
            documentId: i === 0 ? d.documentId : undefined,
            origin: d.origin,
            description: installmentDesc,
            dueDate: due,
            amount,
            status: d.status ?? "aberta",
            paymentDate: parseOptionalDate(d.paymentDate ?? undefined),
            notes: d.notes,
            vehicleId: d.vehicleId ?? undefined,
            supplierId: d.supplierId ?? undefined,
          },
        });
        rows.push(row);
      }
      return rows;
    });

    return ok(created, { status: 201 });
  }

  const created = await prisma.payable.create({
    data: {
      documentId: d.documentId,
      origin: d.origin,
      description: d.description ?? "",
      dueDate: parseDateInput(d.dueDate),
      amount: d.amount,
      status: d.status ?? "aberta",
      paymentDate: parseOptionalDate(d.paymentDate ?? undefined),
      notes: d.notes,
      vehicleId: d.vehicleId ?? undefined,
      supplierId: d.supplierId ?? undefined,
    },
  });

  return ok(created, { status: 201 });
});
