import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { usedBodyUpdateSchema } from "@/lib/zodSchemas";
import {
  adminOnlyRoles,
  allStaffReadRoles,
  commercialWriteRoles,
  productionWriteRoles,
} from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { updateUsedBodyWithStatusHistory } from "@/lib/usedBodies/statusHistory";
import { resolveUsedBodyInternalId } from "@/lib/usedBodyResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const usedBodyInclude = { supplier: { select: { id: true, companyName: true } } } as const;

function canMutateUsedBody(role: Role, body: Record<string, unknown>): boolean {
  const isCommercial = commercialWriteRoles.includes(role);
  const isProduction = productionWriteRoles.includes(role);

  if (body.status === "em_reforma" && !isProduction) {
    return false;
  }

  if (isCommercial) return true;

  if (isProduction) {
    const keys = Object.keys(body).filter((k) => body[k] !== undefined);
    return keys.every((k) => k === "status" || k === "notes" || k === "observations");
  }

  return false;
}

function buildUsedBodyUpdateInput(d: ReturnType<typeof usedBodyUpdateSchema.parse>): Prisma.UsedBodyUpdateInput {
  const data: Prisma.UsedBodyUpdateInput = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.lengthM !== undefined) data.lengthM = d.lengthM;
  if (d.widthM !== undefined) data.widthM = d.widthM;
  if (d.heightM !== undefined) data.heightM = d.heightM;
  if (d.condition !== undefined) data.condition = d.condition;
  if (d.entryValue !== undefined) data.entryValue = d.entryValue;
  if (d.saleValue !== undefined) data.saleValue = d.saleValue;
  if (d.status !== undefined) data.status = d.status;
  if (d.observations !== undefined) data.observations = d.observations;
  if (d.mainPhotoUrl !== undefined) data.mainPhotoUrl = d.mainPhotoUrl === "" ? null : d.mainPhotoUrl;
  if (d.galleryUrls !== undefined) data.galleryUrls = d.galleryUrls;
  if (d.supplierId !== undefined) {
    data.supplier = d.supplierId ? { connect: { id: d.supplierId } } : { disconnect: true };
  }
  return data;
}

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveUsedBodyInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }

  const row = await prisma.usedBody.findUnique({
    where: { id: internalId },
    include: {
      ...usedBodyInclude,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { changedBy: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole([...commercialWriteRoles, ...productionWriteRoles], async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveUsedBodyInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }

  const existing = await prisma.usedBody.findUnique({ where: { id: internalId } });
  if (!existing) {
    return fail("NOT_FOUND", 404);
  }

  const raw: unknown = await req.json();
  const parsed = usedBodyUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const session = await auth();
  const role = session?.user?.role;
  if (!role) {
    return fail("UNAUTHENTICATED", 401);
  }

  const d = parsed.data;
  const permissionCheck = Object.fromEntries(
    Object.entries(d).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>;

  if (!canMutateUsedBody(role, permissionCheck)) {
    return fail("FORBIDDEN", 403);
  }

  const userId = session?.user?.id ? Number(session.user.id) : undefined;
  const updateData = buildUsedBodyUpdateInput(d);

  try {
    const updated = await updateUsedBodyWithStatusHistory(internalId, updateData, {
      previousStatus: existing.status,
      nextStatus: d.status ?? existing.status,
      changedByUserId: Number.isInteger(userId) && userId! > 0 ? userId : undefined,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(adminOnlyRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveUsedBodyInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }
  try {
    await prisma.usedBody.delete({ where: { id: internalId } });
    return ok({ id: internalId });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
