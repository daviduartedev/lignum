import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { clientDocumentCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const clientId = searchParams.get("clientId");

  const where: Prisma.ClientDocumentWhereInput = {};
  if (clientId) {
    const n = parseInt(clientId, 10);
    if (Number.isFinite(n)) {
      where.clientId = n;
    }
  }

  const [total, data] = await prisma.$transaction([
    prisma.clientDocument.count({ where }),
    prisma.clientDocument.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = clientDocumentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.clientDocument.create({
    data: {
      documentId: d.documentId,
      title: d.title,
      notes: d.notes,
      externalUrl: d.externalUrl,
      documentFileUrl: d.documentFileUrl,
      clientId: d.clientId,
    },
  });
  return ok(created, { status: 201 });
});
