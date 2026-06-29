import type { AuditAction, Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { adminOnlyRoles } from "@/lib/apiRoles";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { withRole } from "@/lib/withRole";

const AUDIT_ACTIONS = new Set<string>([
  "login_success",
  "login_failure",
  "user_created",
  "user_updated",
  "user_deactivated",
  "user_reactivated",
  "user_role_changed",
  "user_password_reset",
  "erp_setting_updated",
]);

export const GET = withRole(adminOnlyRoles, async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { skip, take, page, pageSize } = parsePagination(searchParams);

  const where: Prisma.AuditLogWhereInput = {};

  const userIdRaw = searchParams.get("userId");
  if (userIdRaw) {
    const userId = Number.parseInt(userIdRaw, 10);
    if (Number.isInteger(userId) && userId > 0) {
      where.userId = userId;
    }
  }

  const action = searchParams.get("action");
  if (action && AUDIT_ACTIONS.has(action)) {
    where.action = action as AuditAction;
  }

  const resourceType = searchParams.get("resourceType");
  if (resourceType) {
    where.resourceType = resourceType;
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    where.createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
    }
  }

  const [total, data] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});
