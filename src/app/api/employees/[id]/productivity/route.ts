import type { NextRequest } from "next/server";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { getEmployeeProductivity } from "@/lib/employees/productivity";
import { resolveEmployeeInternalId } from "@/lib/employeeResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveEmployeeInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const data = await getEmployeeProductivity(internalId);
  if (!data) return fail("NOT_FOUND", 404);
  return ok(data);
});
