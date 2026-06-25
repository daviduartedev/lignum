import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { staffRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(staffRoles, async (_req: NextRequest) => {
  const session = await auth();
  const role = session?.user?.role;
  const uid = Number(session?.user?.id);

  const base: { ownerUserId?: number } = role === "admin" ? {} : { ownerUserId: uid };

  const [total, unread] = await prisma.$transaction([
    prisma.userNotification.count({ where: base }),
    prisma.userNotification.count({ where: { ...base, read: false } }),
  ]);

  return ok({ total, unread, read: total - unread });
});
