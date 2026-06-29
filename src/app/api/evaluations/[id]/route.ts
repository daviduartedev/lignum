import type { NextRequest } from "next/server";
import { evaluationUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { resolveEvaluationInternalId } from "@/lib/evaluationResolve";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveEvaluationInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }
  const row = await prisma.evaluation.findUnique({ where: { id: internalId } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(commercialWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveEvaluationInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  const raw: unknown = await req.json();
  const parsed = evaluationUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  try {
    const updated = await prisma.evaluation.update({
      where: { id: num },
      data: stripUndefined(parsed.data as Record<string, unknown>),
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(commercialWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const num = await resolveEvaluationInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  try {
    await prisma.evaluation.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
