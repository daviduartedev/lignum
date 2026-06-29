import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { quoteCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";
import { buildQuoteCreateData } from "@/lib/quotes/quoteService";

const quoteInclude = {
  client: { select: { id: true, fullName: true, document: true, email: true } },
  bodyModel: { select: { id: true, name: true, basePrice: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
  technicalSheet: { select: { id: true, sheetNumber: true, bomJson: true } },
};

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");

  const where: Prisma.QuoteWhereInput = {};
  if (status) where.status = status as Prisma.QuoteWhereInput["status"];
  if (q) {
    where.OR = [
      { quoteNumber: { contains: q, mode: "insensitive" } },
      { client: { fullName: { contains: q, mode: "insensitive" } } },
      { client: { document: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.quote.count({ where }),
    prisma.quote.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
      include: quoteInclude,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = quoteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const session = await auth();
  const userId = Number(session?.user?.id);
  const { quoteData } = await buildQuoteCreateData(
    parsed.data,
    Number.isInteger(userId) ? userId : undefined,
  );

  const created = await prisma.quote.create({
    data: quoteData,
    include: quoteInclude,
  });

  return ok(created, { status: 201 });
});
