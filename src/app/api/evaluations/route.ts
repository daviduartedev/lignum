import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { evaluationCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const vehicleId = searchParams.get("vehicleId");

  const where: Prisma.EvaluationWhereInput = {};
  if (vehicleId && Number.isFinite(Number(vehicleId))) {
    where.vehicleId = Number(vehicleId);
  }

  const [total, data] = await prisma.$transaction([
    prisma.evaluation.count({ where }),
    prisma.evaluation.findMany({
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
  const parsed = evaluationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const created = await prisma.evaluation.create({
    data: {
      documentId: d.documentId,
      score: d.score,
      observations: d.observations,
      technicalNotes: d.technicalNotes,
      checklistJson: d.checklistJson ?? undefined,
      photoUrls: d.photoUrls ?? [],
      vehicleId: d.vehicleId,
    },
  });
  return ok(created, { status: 201 });
});
