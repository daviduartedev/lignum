import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { staffRoles } from "@/lib/apiRoles";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { userInboxPreferencesBodySchema } from "@/lib/zodSchemas";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const GET = withRole(staffRoles, async (_req: NextRequest, _ctx: RouteContext) => {
  const session = await auth();
  const uid = Number(session?.user?.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    return fail("UNAUTHENTICATED", 401);
  }
  const row = await prisma.user.findUnique({
    where: { id: uid },
    select: { showDashboardAttentionStripe: true, financeEventNotifyDaysBeforeOverride: true },
  });
  return ok({
    showDashboardAttentionStripe: row?.showDashboardAttentionStripe ?? true,
    financeEventNotifyDaysBeforeOverride: row?.financeEventNotifyDaysBeforeOverride ?? null,
  });
});

export const PUT = withRole(staffRoles, async (req: NextRequest, _ctx: RouteContext) => {
  const session = await auth();
  const uid = Number(session?.user?.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    return fail("UNAUTHENTICATED", 401);
  }

  const raw: unknown = await req.json();
  const parsed = userInboxPreferencesBodySchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  await prisma.user.update({
    where: { id: uid },
    data: {
      showDashboardAttentionStripe: parsed.data.showDashboardAttentionStripe,
      ...(parsed.data.financeEventNotifyDaysBeforeOverride !== undefined
        ? { financeEventNotifyDaysBeforeOverride: parsed.data.financeEventNotifyDaysBeforeOverride }
        : {}),
    },
  });

  return ok({
    showDashboardAttentionStripe: parsed.data.showDashboardAttentionStripe,
    financeEventNotifyDaysBeforeOverride: parsed.data.financeEventNotifyDaysBeforeOverride ?? null,
  });
});
