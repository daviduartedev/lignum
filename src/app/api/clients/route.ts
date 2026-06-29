import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { clientCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { clientSchemaToPrismaData } from "@/lib/clientPrismaMap";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "1") {
    const data = await prisma.client.findMany({ orderBy: { id: "desc" }, take: 500 });
    return ok(data);
  }
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q");

  const where: Prisma.ClientWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { document: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.client.count({ where }),
    prisma.client.findMany({
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
  const parsed = clientCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.client.create({
    data: stripUndefined(clientSchemaToPrismaData(d)) as Prisma.ClientCreateInput,
  });
  return ok(created, { status: 201 });
});
