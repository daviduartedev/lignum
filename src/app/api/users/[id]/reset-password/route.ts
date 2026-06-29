import { hash } from "bcryptjs";
import type { NextRequest } from "next/server";
import { adminOnlyRoles } from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/auditLog";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { revokeUserSessions } from "@/lib/sessionRevocation";
import { adminUserResetPasswordSchema } from "@/lib/zodSchemas";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const POST = withRole(adminOnlyRoles, async (req: NextRequest, ctx: RouteContext) => {
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

  const parsed = adminUserResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const exists = await prisma.user.findUnique({ where: { id: num }, select: { id: true } });
  if (!exists) {
    return fail("NOT_FOUND", 404);
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: num },
    data: { passwordHash },
  });
  await revokeUserSessions(num);

  const session = await auth();
  const actorId = Number(session?.user?.id);
  await writeAuditLog({
    action: "user_password_reset",
    userId: Number.isInteger(actorId) ? actorId : null,
    resourceType: "user",
    resourceId: String(num),
  });

  return ok({ success: true });
});
