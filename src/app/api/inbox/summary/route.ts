import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { buildInboxSummary } from "@/lib/inbox/buildInboxSummary";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, _ctx: RouteContext) => {
  const session = await auth();
  const uid = Number(session?.user?.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    return fail("UNAUTHENTICATED", 401);
  }
  const role = session?.user?.role;
  const payload = await buildInboxSummary(prisma, { userId: uid, role });
  return ok(payload);
});
