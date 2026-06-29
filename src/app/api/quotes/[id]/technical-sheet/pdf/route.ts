import type { NextRequest } from "next/server";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { fail } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { parsePositiveInt } from "@/lib/parseId";
import { applySecurityHeaders } from "@/lib/securityHeaders";
import { renderTechnicalSheetPdf, type TechnicalSheetWithQuote } from "@/lib/pdf/technicalSheetPdf";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  const internalId = idStr ? parsePositiveInt(idStr) : null;
  if (internalId == null) return fail("BAD_REQUEST", 400, { message: "ID inválido." });

  const sheet = await prisma.technicalSheet.findFirst({
    where: { quoteId: internalId },
    include: {
      quote: {
        select: {
          quoteNumber: true,
          lengthM: true,
          widthM: true,
          heightM: true,
          coverStyle: true,
          client: { select: { fullName: true } },
        },
      },
    },
  });
  if (!sheet) return fail("NOT_FOUND", 404);

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

  const pdf = await renderTechnicalSheetPdf(sheet as unknown as TechnicalSheetWithQuote, issuer);
  const fileLabel = sheet.sheetNumber ?? String(sheet.id);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="ficha-tecnica-${fileLabel}.pdf"`);
  headers.set("Cache-Control", "private, no-store");
  applySecurityHeaders(headers);

  return new Response(new Uint8Array(pdf), { status: 200, headers });
});
