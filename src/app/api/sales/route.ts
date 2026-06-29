import { PaymentMethod, type Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { logSecurityWarn } from "@/lib/secureLogger";
import { withRole } from "@/lib/withRole";
import { saleCreateSchema } from "@/lib/zodSchemas";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const clientId = searchParams.get("clientId");
  const vehicleId = searchParams.get("vehicleId");

  const where: Prisma.SaleWhereInput = {};
  if (clientId && Number.isFinite(Number(clientId))) {
    where.clientId = Number(clientId);
  }
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    where.vehicleId = Number(vehicleId);
  }

  const [total, data] = await prisma.$transaction([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

function addMonthsClamped(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

type SaleCreateData = typeof saleCreateSchema._output;

const saleSafeSelect = {
  id: true,
  documentId: true,
  saleDate: true,
  finalPrice: true,
  paymentMethod: true,
  financingBank: true,
  notes: true,
  vehicleId: true,
  clientId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SaleSelect;

function prismaErrorCode(error: unknown): string {
  const candidate = error as { code?: unknown } | null;
  return typeof candidate?.code === "string" ? candidate.code : "";
}

function prismaErrorText(error: unknown): string {
  const candidate = error as { message?: unknown; meta?: unknown } | null;
  const message = error instanceof Error ? error.message : String(candidate?.message ?? error ?? "");
  return `${message} ${JSON.stringify(candidate?.meta ?? {})}`.toLowerCase();
}

function isUniqueSaleVehicleError(error: unknown): boolean {
  const text = prismaErrorText(error);
  return (
    prismaErrorCode(error) === "P2002" ||
    text.includes("unique constraint") ||
    text.includes("sales_vehicle_id_key")
  );
}

function isSellerAttributionSchemaMissing(error: unknown): boolean {
  const text = prismaErrorText(error);
  return (
    prismaErrorCode(error) === "P2022" &&
    (text.includes("seller_user_id") ||
      text.includes("seller_name") ||
      text.includes("selleruserid") ||
      text.includes("sellername"))
  );
}

async function createSaleTransaction(d: SaleCreateData, includeSellerAttribution: boolean) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        documentId: d.documentId,
        saleDate: parseDateInput(d.saleDate),
        finalPrice: d.finalPrice,
        paymentMethod: d.paymentMethod,
        financingBank: d.financingBank,
        notes: d.notes,
        vehicleId: d.vehicleId,
        clientId: d.clientId,
        ...(includeSellerAttribution
          ? {
              sellerUserId: d.sellerUserId,
              sellerName: d.sellerName,
            }
          : {}),
      },
      select: includeSellerAttribution ? undefined : saleSafeSelect,
    });

    await tx.vehicle.update({
      where: { id: d.vehicleId },
      data: { status: "vendido" },
    });

    if (d.paymentMethod === PaymentMethod.promissoria && d.promissoryPlan) {
      const plan = d.promissoryPlan;
      const n = plan.totalInstallments;
      const base = parseDateInput(plan.firstDueDate);
      const amount = plan.installmentAmount;
      const interval = plan.intervalMonths;
      for (let i = 0; i < n; i++) {
        const due = addMonthsClamped(base, i * interval);
        await tx.promissoryNote.create({
          data: {
            installmentNumber: i + 1,
            totalInstallments: n,
            dueDate: due,
            amount,
            status: "aberta",
            clientId: d.clientId,
            vehicleId: d.vehicleId,
          },
        });
      }
    }

    return sale;
  });
}

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = saleCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;

  try {
    const created = await createSaleTransaction(d, true);
    return ok(created, { status: 201 });
  } catch (e) {
    if (isSellerAttributionSchemaMissing(e)) {
      logSecurityWarn("sales.seller_attribution_schema_missing", {
        vehicleId: d.vehicleId,
        clientId: d.clientId,
      });
      const created = await createSaleTransaction(d, false);
      return ok(created, { status: 201 });
    }
    if (isUniqueSaleVehicleError(e)) {
      return fail("CONFLICT", 409, { message: "Ja existe uma venda registrada para este veiculo." });
    }
    if (prismaErrorCode(e) === "P2003") {
      return fail("VALIDATION_ERROR", 400, { message: "Veiculo, cliente ou vendedor invalido." });
    }
    throw e;
  }
});
