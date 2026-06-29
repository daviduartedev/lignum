import type { NextRequest } from "next/server";
import { ok } from "@/lib/jsonResponse";
import { getDocumentLookupProvider } from "@/lib/documentLookup/runLookup";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

function currentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export const GET = withRole("admin", async (_req: NextRequest) => {
  const { start, end } = currentMonthBounds();
  const agg = await prisma.documentLookupAudit.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
      success: true,
      cachedResponse: false,
    },
    _sum: { cost: true },
  });
  const total = agg._sum.cost;
  const provider = getDocumentLookupProvider();
  return ok({
    monthTotal: total != null ? total.toString() : "0",
    currency: "BRL",
    isDemo: provider === "mock",
    provider,
  });
});
