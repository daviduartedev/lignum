import type { NextRequest } from "next/server";
import { adminOnlyRoles } from "@/lib/apiRoles";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/jsonResponse";
import { USER_PUBLIC_SELECT } from "@/lib/userAdminRules";
import { withRole } from "@/lib/withRole";

export const GET = withRole(adminOnlyRoles, async (_req: NextRequest) => {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { id: "desc" }],
    select: USER_PUBLIC_SELECT,
  });
  return ok(users);
});
