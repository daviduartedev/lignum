import type { NextRequest } from "next/server";
import { productionWriteRoles } from "@/lib/apiRoles";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { startProductionOrder } from "@/lib/production/orderTransitions";
import { bomStockErrorToResponse } from "@/lib/production/deductBomStock";
import { resolveProductionOrderInternalId } from "@/lib/productionOrderResolve";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";

export const POST = withRole(productionWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveProductionOrderInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  try {
    const updated = await startProductionOrder(internalId);
    return ok(updated);
  } catch (e) {
    const bomRes = bomStockErrorToResponse(e);
    if (bomRes) return bomRes;
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return fail("NOT_FOUND", 404);
    if (msg === "INVALID_TRANSITION") {
      return fail("CONFLICT", 409, { message: "Não é possível iniciar esta ordem de produção." });
    }
    throw e;
  }
});
