import type { NextRequest } from "next/server";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { fail } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { parsePositiveInt } from "@/lib/parseId";
import { applySecurityHeaders } from "@/lib/securityHeaders";
import { renderQuotePdf, type QuoteWithRelations } from "@/lib/pdf/quotePdf";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  const internalId = idStr ? parsePositiveInt(idStr) : null;
  if (internalId == null) return fail("BAD_REQUEST", 400, { message: "ID inválido." });

  const quote = await prisma.quote.findFirst({
    where: { id: internalId },
    include: {
      client: {
        select: { fullName: true, document: true, email: true },
      },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quote) return fail("NOT_FOUND", 404);

  const issuer = await prisma.erpSetting.findUnique({
    where: { id: 1 },
    select: {
      companyName: true,
      companyTaxId: true,
      companyStateReg: true,
      companyAddress: true,
      companyCity: true,
      companyState: true,
      companyZip: true,
      companyPhone: true,
      companyEmail: true,
    },
  });

  const pdf = await renderQuotePdf(quote as unknown as QuoteWithRelations, issuer);
  const fileLabel = quote.quoteNumber ?? quote.documentId ?? String(quote.id);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="orcamento-${fileLabel}.pdf"`);
  headers.set("Cache-Control", "private, no-store");
  applySecurityHeaders(headers);

  return new Response(new Uint8Array(pdf), { status: 200, headers });
});
