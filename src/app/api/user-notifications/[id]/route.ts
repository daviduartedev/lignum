import type { Prisma, UserNotification } from "@prisma/client";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { userNotificationUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, staffPreferencesWriteRoles } from "@/lib/apiRoles";
import { parseOptionalDate } from "@/lib/dates";
import { isSafeUserLinkUrl } from "@/lib/urlSafety";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

async function assertOwnerOrAdmin(
  num: number,
): Promise<{ ok: true; row: UserNotification } | { ok: false; response: Response }> {
  const session = await auth();
  const role = session?.user?.role;
  const uid = Number(session?.user?.id);
  const row = await prisma.userNotification.findUnique({ where: { id: num } });
  if (!row) {
    return { ok: false, response: fail("NOT_FOUND", 404) };
  }
  if (role !== "admin" && row.ownerUserId !== uid) {
    return { ok: false, response: fail("NOT_FOUND", 404) };
  }
  return { ok: true, row };
}

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const gate = await assertOwnerOrAdmin(num);
  if (!gate.ok) {
    return gate.response;
  }
  return ok(gate.row);
});

export const PUT = withRole(staffPreferencesWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const gate = await assertOwnerOrAdmin(num);
  if (!gate.ok) {
    return gate.response;
  }

  const session = await auth();
  const role = session?.user?.role;

  const raw: unknown = await req.json();
  const parsed = userNotificationUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  if (d.link != null && String(d.link).trim() !== "") {
    const linkCheck = isSafeUserLinkUrl(String(d.link));
    if (!linkCheck.ok) {
      return fail("VALIDATION_ERROR", 422, { message: linkCheck.message });
    }
  }
  const { remindAt, ownerUserId, ...rest } = d;
  const data = stripUndefined(rest as Record<string, unknown>) as Prisma.UserNotificationUpdateInput;
  if (remindAt !== undefined) {
    data.remindAt = parseOptionalDate(remindAt as string | null | undefined);
  }
  if (role === "admin" && ownerUserId !== undefined && typeof ownerUserId === "number") {
    data.owner = { connect: { id: ownerUserId } };
  }

  try {
    const updated = await prisma.userNotification.update({
      where: { id: num },
      data,
    });
    return ok(updated);
  } catch {
    return fail("NOT_FOUND", 404);
  }
});

export const DELETE = withRole(staffPreferencesWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const gate = await assertOwnerOrAdmin(num);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    await prisma.userNotification.delete({ where: { id: num } });
    return ok({ id: num });
  } catch {
    return fail("NOT_FOUND", 404);
  }
});
