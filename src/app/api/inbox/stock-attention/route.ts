import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { inboxStockActionSchema } from "@/lib/zodSchemas";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const SNOOZE_MS = 24 * 60 * 60 * 1000;

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const session = await auth();
  const uid = Number(session?.user?.id);
  if (!Number.isFinite(uid) || uid <= 0) {
    return fail("UNAUTHENTICATED", 401);
  }

  const raw: unknown = await req.json();
  const parsed = inboxStockActionSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const { vehicleId, action } = parsed.data;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) {
    return fail("NOT_FOUND", 404, { message: "Veículo não encontrado." });
  }

  const now = new Date();
  const snoozedUntil = action === "snooze" ? new Date(now.getTime() + SNOOZE_MS) : null;
  const dismissed = action === "dismiss";

  await prisma.userStockAttentionPreference.upsert({
    where: { userId_vehicleId: { userId: uid, vehicleId } },
    create: {
      userId: uid,
      vehicleId,
      dismissed,
      snoozedUntil: action === "snooze" ? snoozedUntil : null,
    },
    update: {
      dismissed,
      snoozedUntil: action === "snooze" ? snoozedUntil : null,
    },
  });

  return ok({ ok: true });
});
