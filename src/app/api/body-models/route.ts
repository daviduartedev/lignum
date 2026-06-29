import type { NextRequest } from "next/server";
import { bodyModelCreateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const GET = withRole(allStaffReadRoles, async () => {
  const data = await prisma.bodyModel.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return ok(data);
});

export const POST = withRole(commercialWriteRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = bodyModelCreateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const d = parsed.data;
  const created = await prisma.bodyModel.create({
    data: {
      documentId: d.documentId,
      name: d.name,
      description: d.description,
      basePrice: d.basePrice,
      pricePerM2: d.pricePerM2 ?? 0,
      active: d.active ?? true,
    },
  });
  return ok(created, { status: 201 });
});
