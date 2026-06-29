import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { userNotificationCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, staffPreferencesWriteRoles } from "@/lib/apiRoles";
import { parseOptionalDate } from "@/lib/dates";
import { isSafeUserLinkUrl } from "@/lib/urlSafety";
import { fail, ok } from "@/lib/jsonResponse";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const session = await auth();
  const role = session?.user?.role;
  const uid = Number(session?.user?.id);

  const { searchParams } = new URL(req.url);
  if (searchParams.get("all") === "1") {
    const whereAll: Prisma.UserNotificationWhereInput = role === "admin" ? {} : { ownerUserId: uid };
    const data = await prisma.userNotification.findMany({
      where: whereAll,
      orderBy: { id: "desc" },
      take: 500,
    });
    return ok(data);
  }

  const { skip, take, page, pageSize } = parsePagination(searchParams);
  const readParam = searchParams.get("read");

  const where: Prisma.UserNotificationWhereInput =
    role === "admin" ? {} : { ownerUserId: uid };

  if (readParam === "true") {
    where.read = true;
  } else if (readParam === "false") {
    where.read = false;
  }

  const [total, data] = await prisma.$transaction([
    prisma.userNotification.count({ where }),
    prisma.userNotification.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take,
    }),
  ]);

  return ok(data, {}, paginationMeta(total, page, pageSize));
});

export const POST = withRole(staffPreferencesWriteRoles, async (req: NextRequest) => {
  const session = await auth();
  const role = session?.user?.role;
  const uid = Number(session?.user?.id);

  const raw: unknown = await req.json();
  const parsed = userNotificationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  if (role === "admin" && d.ownerUserId == null) {
    return fail("VALIDATION_ERROR", 422, { message: "Informe o usuário destinatário (ownerUserId)." });
  }
  const ownerUserId = role === "admin" ? (d.ownerUserId as number) : uid;

  if (typeof d.link === "string" && d.link.trim() !== "") {
    const linkCheck = isSafeUserLinkUrl(d.link);
    if (!linkCheck.ok) {
      return fail("VALIDATION_ERROR", 422, { message: linkCheck.message });
    }
  }

  const created = await prisma.userNotification.create({
    data: {
      documentId: d.documentId,
      title: d.title,
      body: d.body,
      read: d.read ?? false,
      link: d.link,
      remindAt: parseOptionalDate(d.remindAt ?? undefined),
      ownerUserId,
    },
  });
  return ok(created, { status: 201 });
});
