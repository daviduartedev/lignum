import type { NextRequest } from "next/server";
import { quoteCalculateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles } from "@/lib/apiRoles";
import { ok } from "@/lib/jsonResponse";
import { zodErrorResponse } from "@/lib/routeUtils";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";
import { calculateQuotePricing } from "@/lib/quotes/pricingEngine";
import { loadQuotePricingSettings } from "@/lib/quotes/quoteService";

export const POST = withRole(allStaffReadRoles, async (req: NextRequest) => {
  const raw: unknown = await req.json();
  const parsed = quoteCalculateSchema.safeParse(raw);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }
  const d = parsed.data;
  const pricingSettings = await loadQuotePricingSettings();

  let basePrice = d.basePrice ?? 15000;
  let pricePerM2 = d.pricePerM2 ?? 0;
  let bodyModelName: string | undefined;

  if (d.bodyModelId) {
    const model = await prisma.bodyModel.findUnique({ where: { id: d.bodyModelId } });
    if (model) {
      basePrice = Number(model.basePrice);
      pricePerM2 = Number(model.pricePerM2);
      bodyModelName = model.name;
    }
  }

  const result = calculateQuotePricing({
    bodyModelName,
    basePrice,
    pricePerM2,
    lengthM: d.lengthM,
    widthM: d.widthM,
    heightM: d.heightM,
    coverStyle: d.coverStyle,
    floorType: d.floorType,
    finishType: d.finishType,
    options: d.options ?? [],
    discount: d.discount ?? 0,
    pricing: pricingSettings,
  });

  return ok(result);
});
