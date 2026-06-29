import type { NextRequest } from "next/server";
import { allStaffReadRoles, financeWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest) => {
  const rows = await prisma.promissoryNote.findMany({
    select: {
      status: true,
      dueDate: true,
      amount: true,
      paymentDate: true,
    },
  });

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = startOfToday();
  const in7 = addDays(today, 7);

  let aberto = 0;
  let vencido = 0;
  let sete = 0;
  let recebidoMes = 0;

  for (const r of rows) {
    const amt = Number(r.amount);
    if (r.status === "paga") {
      if (r.paymentDate && r.paymentDate >= startMonth) recebidoMes += amt;
      continue;
    }
    if (r.status === "cancelada") continue;
    if (r.status === "vencida" || (r.status === "aberta" && r.dueDate < today)) {
      vencido += amt;
      continue;
    }
    if (r.status === "aberta") {
      aberto += amt;
      const due = r.dueDate;
      if (due <= in7) sete += amt;
    }
  }

  return ok({ aberto, vencido, sete, recebidoMes });
});
