import type { NextRequest } from "next/server";
import { commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { resolveQuoteInternalId } from "@/lib/quoteResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";
import { buildBomFromQuote } from "@/lib/quotes/bomBuilder";
import { loadQuotePricingSettings } from "@/lib/quotes/quoteService";
import {
  buildProductionOrderNumber,
  productionOrderInclude,
} from "@/lib/production/orderTransitions";

export const POST = withRole(commercialWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveQuoteInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const quote = await prisma.quote.findUnique({
    where: { id: internalId },
    include: { items: true, technicalSheet: true, productionOrder: true },
  });
  if (!quote) return fail("NOT_FOUND", 404);
  if (quote.status !== "aprovado") {
    return fail("CONFLICT", 409, { message: "Apenas orçamentos aprovados podem ser convertidos." });
  }
  if (quote.technicalSheet || quote.productionOrder) {
    return fail("CONFLICT", 409, { message: "Orçamento já convertido." });
  }

  const pricing = await loadQuotePricingSettings();
  const bom = buildBomFromQuote(quote, pricing);
  const year = new Date().getFullYear();
  const sheetNumber = `FT-${year}-${String(quote.id).padStart(4, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const sheet = await tx.technicalSheet.create({
      data: {
        quoteId: quote.id,
        sheetNumber,
        bomJson: bom,
        notes: quote.notes,
      },
    });

    const provisional = await tx.productionOrder.create({
      data: {
        quoteId: quote.id,
        technicalSheetId: sheet.id,
        status: "aguardando",
      },
    });

    const orderNumber = buildProductionOrderNumber(provisional.id);
    const productionOrder = await tx.productionOrder.update({
      where: { id: provisional.id },
      data: { orderNumber },
      include: productionOrderInclude,
    });

    const updated = await tx.quote.update({
      where: { id: quote.id },
      data: { status: "convertido", convertedAt: new Date() },
      include: {
        client: { select: { id: true, fullName: true, document: true, email: true } },
        bodyModel: { select: { id: true, name: true, basePrice: true } },
        items: { orderBy: { sortOrder: "asc" } },
        technicalSheet: true,
        productionOrder: true,
      },
    });

    return { quote: updated, technicalSheet: sheet, productionOrder };
  });

  return ok(result);
});
