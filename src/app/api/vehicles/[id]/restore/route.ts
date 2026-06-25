import type { NextRequest } from "next/server";
import { vehicleRestoreSchema } from "@/lib/zodSchemas";
import { fail, ok } from "@/lib/jsonResponse";
import { parseNumericId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";

export const POST = withRole("admin", async (req: NextRequest, ctx: RouteContext) => {
  const num = await parseNumericId(ctx);
  if (num == null) {
    return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  }

  const text = await req.text();
  let raw: unknown = {};
  if (text.trim()) {
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      return fail("BAD_REQUEST", 400, { message: "Corpo JSON inválido." });
    }
  }
  const parsed = vehicleRestoreSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const { status } = parsed.data;

  if (status === "vendido") {
    return fail("VALIDATION_ERROR", 422, {
      message:
        "Não é possível restaurar diretamente como vendido. Coloque o veículo como disponível e registe a venda no fluxo comercial.",
    });
  }

  const v = await prisma.vehicle.findUnique({ where: { id: num } });
  if (!v) {
    return fail("NOT_FOUND", 404);
  }
  if (v.status !== "removido") {
    return fail("VALIDATION_ERROR", 422, { message: "Apenas veículos removidos podem ser restaurados por esta ação." });
  }

  const updated = await prisma.vehicle.update({
    where: { id: num },
    data: { status },
  });
  return ok(updated);
});
