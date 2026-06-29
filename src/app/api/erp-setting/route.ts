import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { erpSettingUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/auditLog";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { stripUndefined } from "@/lib/stripUndefined";
import { withRole } from "@/lib/withRole";

const ERP_SETTING_ID = 1;

/** ErpSetting singleton (id=1). */
export const GET = withRole(allStaffReadRoles, async (_req: NextRequest) => {
  let row = await prisma.erpSetting.findUnique({ where: { id: ERP_SETTING_ID } });
  if (!row) {
    row = await prisma.erpSetting.create({ data: { id: ERP_SETTING_ID } });
  }
  return ok(row);
});

export const PUT = withRole(["admin"], async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = erpSettingUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const data = stripUndefined(parsed.data as Record<string, unknown>);

  const row = await prisma.erpSetting.upsert({
    where: { id: ERP_SETTING_ID },
    create: { id: ERP_SETTING_ID, ...(data as Prisma.ErpSettingCreateInput) },
    update: data as Prisma.ErpSettingUpdateInput,
  });

  const session = await auth();
  const actorId = Number(session?.user?.id);
  await writeAuditLog({
    action: "erp_setting_updated",
    userId: Number.isInteger(actorId) ? actorId : null,
    resourceType: "erp_setting",
    resourceId: String(ERP_SETTING_ID),
    metadata: { fields: Object.keys(data) },
  });

  return ok(row);
});
