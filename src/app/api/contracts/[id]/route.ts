import type { NextRequest } from "next/server";
import { contractUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { resolveContractInternalId } from "@/lib/contractResolve";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const internalId = await resolveContractInternalId(idStr);
  if (internalId == null) {
    return fail("NOT_FOUND", 404);
  }
  const row = await prisma.contract.findUnique({ where: { id: internalId } });
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
  const num = await resolveContractInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  const raw: unknown = await req.json();
  const parsed = contractUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const { contractDate, ...rest } = d;
  const data = stripUndefined({
    ...rest,
    ...(contractDate ? { contractDate: parseDateInput(contractDate) } : {}),
  } as Record<string, unknown>);
  try {
    const updated = await prisma.contract.update({
      where: { id: num },
      data,
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
  const num = await resolveContractInternalId(idStr);
  if (num == null) {
    return fail("NOT_FOUND", 404);
  }
  try {
    await prisma.contract.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
