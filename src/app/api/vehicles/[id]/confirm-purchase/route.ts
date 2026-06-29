import type { NextRequest } from "next/server";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function addMonthsClamped(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

type InstallmentPlan = {
  totalInstallments?: number;
  installmentAmount?: number | string;
  firstDueDate?: string;
  intervalMonths?: number;
};

type PurchasePaymentJson = {
  method?: string;
  notes?: string;
  installmentPlan?: InstallmentPlan;
};

export const POST = withRole(commercialWriteRoles, async (_req: NextRequest, ctx) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }

  const v = await prisma.vehicle.findUnique({
    where: { id: num },
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      purchasePaymentJson: true,
      purchasePrice: true,
      purchaseSupplierId: true,
    },
  });
  if (!v) return fail("NOT_FOUND", 404);

  const hasPayment = v.purchasePaymentJson != null;
  if (!hasPayment) {
    return fail("VALIDATION_ERROR", 422, {
      message: "Informe os dados de pagamento da compra antes de confirmar.",
    });
  }

  const payment = v.purchasePaymentJson as PurchasePaymentJson | null;
  const plan = payment?.installmentPlan;

  if (!plan?.totalInstallments || !plan.firstDueDate || plan.installmentAmount == null) {
    return ok({
      vehicleId: v.id,
      payablesCreated: 0,
      message: "Compra confirmada. Nenhum plano parcelado configurado para lançamento automático.",
    });
  }

  const n = Math.max(1, Number(plan.totalInstallments) || 1);
  const amount = Number(plan.installmentAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("VALIDATION_ERROR", 422, { message: "Valor da parcela inválido no plano de pagamento." });
  }

  const interval = Math.max(1, Number(plan.intervalMonths) || 1);
  const base = parseDateInput(plan.firstDueDate);
  const descBase = `Compra ${v.plate} - ${v.brand} ${v.model}`.trim();

  const payables = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const due = addMonthsClamped(base, i * interval);
      const row = await tx.payable.create({
        data: {
          origin: "compra_veiculo",
          description: n > 1 ? `${descBase} (${i + 1}/${n})` : descBase,
          dueDate: due,
          amount,
          status: "aberta",
          vehicleId: v.id,
          supplierId: v.purchaseSupplierId ?? undefined,
          notes: payment?.notes ?? undefined,
        },
      });
      rows.push(row);
    }
    return rows;
  });

  return ok({
    vehicleId: v.id,
    payablesCreated: payables.length,
    payables,
  });
});
