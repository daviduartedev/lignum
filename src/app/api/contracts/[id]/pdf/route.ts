import type { NextRequest } from "next/server";
import { staffRoles } from "@/lib/apiRoles";
import { fail } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { parsePositiveInt } from "@/lib/parseId";
import { applySecurityHeaders } from "@/lib/securityHeaders";
import { renderContractPdf, type ContractWithRelations } from "@/lib/pdf/contractPdf";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

/**
 * GET /api/contracts/[id]/pdf - PDF preenchido do contrato (cycle 0614 Stage 1).
 *
 * Isolamento: o contrato e carregado via ctx.db (Prisma escopado por tenant),
 * portanto um pedido para um contrato de outro tenant resulta em 404 - sem IDOR.
 * Auth obrigatoria via withRole(staffRoles).
 */
export const GET = withRole(staffRoles, async (_req: NextRequest, ctx: RouteContext) => {

  const idStr = await segmentId(ctx.params);
  const internalId = idStr ? parsePositiveInt(idStr) : null;
  if (internalId == null) {
    return fail("BAD_REQUEST", 400, { message: "ID invalido." });
  }

  // Tenant-scoped: findFirst no db injetado nunca retorna contrato de outro tenant.
  const contract = await prisma.contract.findFirst({
    where: { id: internalId },
    include: {
      vehicle: {
        select: {
          brand: true,
          model: true,
          version: true,
          yearManufacture: true,
          yearModel: true,
          plate: true,
          renavam: true,
          chassis: true,
          color: true,
          mileage: true,
        },
      },
      client: {
        select: {
          fullName: true,
          document: true,
          rg: true,
          address: true,
          city: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!contract) {
    return fail("NOT_FOUND", 404);
  }

  // Emissor: ErpSetting do tenant (linha unica por tenant).
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

  const pdf = await renderContractPdf(contract as unknown as ContractWithRelations, issuer);
  const fileLabel = contract.documentId ?? String(contract.id);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="contrato-${fileLabel}.pdf"`);
  headers.set("Cache-Control", "private, no-store");
  applySecurityHeaders(headers);

  // Buffer -> Uint8Array para o BodyInit do Response.
  return new Response(new Uint8Array(pdf), { status: 200, headers });
});
