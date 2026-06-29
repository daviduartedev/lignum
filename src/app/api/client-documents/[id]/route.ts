import type { NextRequest } from "next/server";
import { clientDocumentUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const row = await prisma.clientDocument.findUnique({ where: { id: num } });
  if (!row) {
    return fail("NOT_FOUND", 404);
  }
  return ok(row);
});

export const PUT = withRole(commercialWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const raw: unknown = await req.json();
  const parsed = clientDocumentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  try {
    const updated = await prisma.clientDocument.update({
      where: { id: num },
      data: stripUndefined(parsed.data as Record<string, unknown>),
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(commercialWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  try {
    await prisma.clientDocument.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
