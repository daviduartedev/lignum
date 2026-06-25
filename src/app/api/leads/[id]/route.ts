import type { NextRequest } from "next/server";
import { z } from "zod";
import { staffRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { parsePositiveInt } from "@/lib/parseId";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

const patchSchema = z.object({ read: z.boolean() });

/**
 * PATCH /api/leads/[id] — marca um lead como lido/não lido (cycle 0618).
 * Staff, tenant-scoped: `updateMany` no db escopado só afeta leads do tenant (sem IDOR).
 */
export const PATCH = withRole(staffRoles, async (req: NextRequest, ctx) => {
  const idStr = await segmentId(ctx.params);
  const id = idStr ? parsePositiveInt(idStr) : null;
  if (id == null) return fail("BAD_REQUEST", 400, { message: "ID inválido." });

  const raw: unknown = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const res = await prisma.storefrontLead.updateMany({
    where: { id },
    data: { readAt: parsed.data.read ? new Date() : null },
  });
  if (res.count === 0) return fail("NOT_FOUND", 404);

  return ok({ id, read: parsed.data.read });
});
