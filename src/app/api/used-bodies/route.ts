import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { usedBodyCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";
import { createUsedBodyWithInitialHistory } from "@/lib/usedBodies/statusHistory";
import { auth } from "@/lib/auth";

const usedBodyInclude = { supplier: { select: { id: true, companyName: true } } } as const;

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "1") {
    const status = searchParams.get("status");
    const where: Prisma.UsedBodyWhereInput = {};
    if (status) where.status = status as Prisma.EnumUsedBodyStatusFilter["equals"];
    const data = await prisma.usedBody.findMany({
      where,
      orderBy: { id: "desc" },
      take: 500,
      include: usedBodyInclude,
    });
    return ok(data);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");

  const where: Prisma.UsedBodyWhereInput = {};
  if (status) where.status = status as Prisma.EnumUsedBodyStatusFilter["equals"];
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { observations: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, data] = await prisma.$transaction([
    prisma.usedBody.count({ where }),
    prisma.usedBody.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
      include: usedBodyInclude,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = usedBodyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  const d = parsed.data;
  const created = await createUsedBodyWithInitialHistory(
    {
      documentId: d.documentId,
      title: d.title,
      lengthM: d.lengthM,
      widthM: d.widthM,
      heightM: d.heightM ?? undefined,
      condition: d.condition,
      entryValue: d.entryValue,
      saleValue: d.saleValue ?? undefined,
      status: d.status ?? "disponivel",
      observations: d.observations,
      mainPhotoUrl: d.mainPhotoUrl || undefined,
      galleryUrls: d.galleryUrls ?? [],
      supplier: d.supplierId ? { connect: { id: d.supplierId } } : undefined,
    },
    Number.isInteger(userId) && userId! > 0 ? userId : undefined,
  );

  return ok(created, { status: 201 });
});
