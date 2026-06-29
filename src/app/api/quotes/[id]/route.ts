import type { NextRequest } from "next/server";
import { quoteUpdateSchema } from "@/lib/zodSchemas";
import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";
import { parseDateInput } from "@/lib/dates";
import { fail, ok } from "@/lib/jsonResponse";
import { segmentId } from "@/lib/routeParams";
import { zodErrorResponse } from "@/lib/routeUtils";
import { resolveQuoteInternalId } from "@/lib/quoteResolve";
import { stripUndefined } from "@/lib/stripUndefined";
import type { RouteContext } from "@/lib/withRole";
import { withRole } from "@/lib/withRole";
import { prisma } from "@/lib/db";
import {
  canTransitionQuoteStatus,
  loadQuotePricingSettings,
  quoteIsEditable,
} from "@/lib/quotes/quoteService";
import { calculateQuotePricing } from "@/lib/quotes/pricingEngine";

const quoteInclude = {
  client: { select: { id: true, fullName: true, document: true, email: true, phone: true } },
  bodyModel: { select: { id: true, name: true, basePrice: true, pricePerM2: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
  technicalSheet: true,
};

export const GET = withRole(allStaffReadRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveQuoteInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const row = await prisma.quote.findUnique({
    where: { id: internalId },
    include: quoteInclude,
  });
  if (!row) return fail("NOT_FOUND", 404);
  return ok(row);
});

export const PUT = withRole(commercialWriteRoles, async (req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveQuoteInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const existing = await prisma.quote.findUnique({
    where: { id: internalId },
    include: { items: true },
  });
  if (!existing) return fail("NOT_FOUND", 404);
  if (existing.status === "convertido") {
    return fail("CONFLICT", 409, { message: "Orçamento convertido não pode ser editado." });
  }

  const raw: unknown = await req.json();
  const parsed = quoteUpdateSchema.safeParse(raw);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const d = parsed.data;

  if (d.status && !canTransitionQuoteStatus(existing.status, d.status)) {
    return fail("BAD_REQUEST", 400, { message: "Transição de status inválida." });
  }

  const paramKeys = ["lengthM", "widthM", "heightM", "coverStyle", "floorType", "finishType", "options", "discount", "bodyModelId"] as const;
  const hasParamChange = paramKeys.some((k) => d[k] !== undefined);
  if (hasParamChange && !quoteIsEditable(existing.status)) {
    return fail("CONFLICT", 409, { message: "Parâmetros só podem ser alterados em rascunho ou enviado." });
  }

  const pricingSettings = await loadQuotePricingSettings();
  const bodyModelId = d.bodyModelId === null ? null : (d.bodyModelId ?? existing.bodyModelId);
  const bodyModel = bodyModelId
    ? await prisma.bodyModel.findUnique({ where: { id: bodyModelId } })
    : null;

  let itemsUpdate:
    | { deleteMany: Record<string, never>; create: ReturnType<typeof mapPricingItems> }
    | undefined;
  let subtotal = Number(existing.subtotal);
  let discount = Number(existing.discount);
  let total = Number(existing.total);
  let marginPercent = existing.marginPercent != null ? Number(existing.marginPercent) : null;

  if (hasParamChange) {
    const pricing = calculateQuotePricing({
      bodyModelName: bodyModel?.name,
      basePrice: bodyModel ? Number(bodyModel.basePrice) : 15000,
      pricePerM2: bodyModel ? Number(bodyModel.pricePerM2) : 0,
      lengthM: d.lengthM ?? Number(existing.lengthM),
      widthM: d.widthM ?? Number(existing.widthM),
      heightM: d.heightM ?? Number(existing.heightM),
      coverStyle: d.coverStyle ?? existing.coverStyle,
      floorType: d.floorType ?? existing.floorType,
      finishType: d.finishType ?? existing.finishType,
      options: d.options ?? (Array.isArray(existing.optionsJson) ? (existing.optionsJson as string[]) : []),
      discount: d.discount ?? Number(existing.discount),
      pricing: pricingSettings,
    });
    subtotal = pricing.subtotal;
    discount = pricing.discount;
    total = pricing.total;
    marginPercent = pricing.marginPercent;
    itemsUpdate = {
      deleteMany: {},
      create: mapPricingItems(pricing.items),
    };
  } else if (d.discount !== undefined) {
    discount = d.discount;
    total = Math.max(0, subtotal - discount);
  }

  const nextStatus = d.status ?? existing.status;
  const approvedAt =
    nextStatus === "aprovado" && existing.status !== "aprovado"
      ? new Date()
      : existing.approvedAt;

  const data = stripUndefined({
    ...(d.clientId != null ? { clientId: d.clientId } : {}),
    ...(d.bodyModelId !== undefined ? { bodyModelId: d.bodyModelId } : {}),
    ...(d.lengthM != null ? { lengthM: d.lengthM } : {}),
    ...(d.widthM != null ? { widthM: d.widthM } : {}),
    ...(d.heightM != null ? { heightM: d.heightM } : {}),
    ...(d.coverStyle ? { coverStyle: d.coverStyle } : {}),
    ...(d.floorType ? { floorType: d.floorType } : {}),
    ...(d.finishType ? { finishType: d.finishType } : {}),
    ...(d.options ? { optionsJson: d.options } : {}),
    subtotal,
    discount,
    total,
    marginPercent,
    ...(d.paymentTerms !== undefined ? { paymentTerms: d.paymentTerms } : {}),
    ...(d.deliveryDays !== undefined ? { deliveryDays: d.deliveryDays } : {}),
    ...(d.notes !== undefined ? { notes: d.notes } : {}),
    ...(d.validUntil !== undefined
      ? { validUntil: d.validUntil ? parseDateInput(d.validUntil) : null }
      : {}),
    ...(d.status ? { status: d.status } : {}),
    approvedAt,
    ...(itemsUpdate ? { items: itemsUpdate } : {}),
  } as Record<string, unknown>);

  const updated = await prisma.quote.update({
    where: { id: internalId },
    data,
    include: quoteInclude,
  });
  return ok(updated);
});

export const DELETE = withRole(commercialWriteRoles, async (_req: NextRequest, ctx: RouteContext) => {
  const idStr = await segmentId(ctx.params);
  if (!idStr) return fail("BAD_REQUEST", 400, { message: "ID inválido." });
  const internalId = await resolveQuoteInternalId(idStr);
  if (internalId == null) return fail("NOT_FOUND", 404);

  const existing = await prisma.quote.findUnique({ where: { id: internalId } });
  if (!existing) return fail("NOT_FOUND", 404);
  if (existing.status === "convertido") {
    return fail("CONFLICT", 409, { message: "Orçamento convertido não pode ser excluído." });
  }

  await prisma.quote.delete({ where: { id: internalId } });
  return ok({ id: internalId });
});

function mapPricingItems(items: ReturnType<typeof calculateQuotePricing>["items"]) {
  return items.map((item, idx) => ({
    sortOrder: idx,
    itemType: item.itemType,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));
}
