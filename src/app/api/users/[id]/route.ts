import type { NextRequest } from "next/server";
import { adminOnlyRoles } from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/auditLog";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { revokeUserSessions } from "@/lib/sessionRevocation";
import { USER_PUBLIC_SELECT, validateUserPatch } from "@/lib/userAdminRules";
import { adminUserPatchSchema } from "@/lib/zodSchemas";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const GET = withRole(adminOnlyRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }
  const user = await prisma.user.findUnique({
    where: { id: num },
    select: USER_PUBLIC_SELECT,
  });
  if (!user) {
    return fail("NOT_FOUND", 404);
  }
  return ok(user);
});

export const PATCH = withRole(adminOnlyRoles, async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("BAD_REQUEST", 400, { message: "JSON inválido." });
  }

  const parsed = adminUserPatchSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const session = await auth();
  const actorId = Number(session?.user?.id);
  if (!Number.isInteger(actorId) || actorId <= 0) {
    return fail("UNAUTHENTICATED", 401);
  }

  const validation = await validateUserPatch(num, actorId, parsed.data);
  if (!validation.ok) {
    return fail("VALIDATION_ERROR", 400, { message: validation.message });
  }

  const before = await prisma.user.findUnique({
    where: { id: num },
    select: { role: true, isActive: true, name: true },
  });
  if (!before) {
    return fail("NOT_FOUND", 404);
  }

  const updated = await prisma.user.update({
    where: { id: num },
    data: parsed.data,
    select: USER_PUBLIC_SELECT,
  });

  const actorUserId = actorId;
  if (parsed.data.role != null && parsed.data.role !== before.role) {
    await writeAuditLog({
      action: "user_role_changed",
      userId: actorUserId,
      resourceType: "user",
      resourceId: String(num),
      metadata: { fromRole: before.role, toRole: parsed.data.role },
    });
    await revokeUserSessions(num);
  } else if (parsed.data.isActive === false && before.isActive) {
    await writeAuditLog({
      action: "user_deactivated",
      userId: actorUserId,
      resourceType: "user",
      resourceId: String(num),
    });
    await revokeUserSessions(num);
  } else if (parsed.data.isActive === true && !before.isActive) {
    await writeAuditLog({
      action: "user_reactivated",
      userId: actorUserId,
      resourceType: "user",
      resourceId: String(num),
    });
  } else {
    await writeAuditLog({
      action: "user_updated",
      userId: actorUserId,
      resourceType: "user",
      resourceId: String(num),
      metadata: { fields: Object.keys(parsed.data) },
    });
  }

  return ok(updated);
});
