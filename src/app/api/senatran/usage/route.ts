import type { NextRequest } from "next/server";
import { ok } from "@/lib/jsonResponse";
import { getSenatranProvider } from "@/lib/senatran/runLookup";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

/** Mês civil corrente no fuso local do servidor (alinhado a spec/domain até haver biblioteca de timezone dedicada). */
function currentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export const GET = withRole("admin", async (_req: NextRequest) => {
  const { start, end } = currentMonthBounds();
  const agg = await prisma.senatranLookupAudit.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
      success: true,
    },
    _sum: { cost: true },
  });
  const total = agg._sum.cost;
  const provider = getSenatranProvider();
  return ok({
    monthTotal: total != null ? total.toString() : "0",
    currency: "BRL",
    isDemo: provider === "mock",
    provider,
  });
});
