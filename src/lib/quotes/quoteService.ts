import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateQuotePricing } from "@/lib/quotes/pricingEngine";
import { parseQuotePricingJson } from "@/lib/quotes/quotePricingDefaults";
import type { QuoteCreateInput } from "@/lib/zodSchemas";

export async function loadQuotePricingSettings() {
  const row = await prisma.erpSetting.findUnique({
    where: { id: 1 },
    select: { quotePricingJson: true },
  });
  return parseQuotePricingJson(row?.quotePricingJson);
}

export async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORC-${year}-`;
  const last = await prisma.quote.findFirst({
    where: { quoteNumber: { startsWith: prefix } },
    orderBy: { quoteNumber: "desc" },
    select: { quoteNumber: true },
  });
  const seq = last?.quoteNumber ? Number(last.quoteNumber.slice(prefix.length)) : 0;
  return `${prefix}${String((Number.isFinite(seq) ? seq : 0) + 1).padStart(4, "0")}`;
}

export async function buildQuoteCreateData(
  d: QuoteCreateInput,
  createdByUserId?: number,
): Promise<{
  quoteData: Prisma.QuoteCreateInput;
  items: Prisma.QuoteItemCreateWithoutQuoteInput[];
}> {
  const pricingSettings = await loadQuotePricingSettings();
  const bodyModel = d.bodyModelId
    ? await prisma.bodyModel.findUnique({ where: { id: d.bodyModelId } })
    : null;

  const pricing = calculateQuotePricing({
    bodyModelName: bodyModel?.name,
    basePrice: bodyModel ? Number(bodyModel.basePrice) : 15000,
    pricePerM2: bodyModel ? Number(bodyModel.pricePerM2) : 0,
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

  const quoteNumber = await nextQuoteNumber();
  const validUntil = d.validUntil ? new Date(`${d.validUntil}T12:00:00`) : null;

  const items: Prisma.QuoteItemCreateWithoutQuoteInput[] = pricing.items.map((item, idx) => ({
    sortOrder: idx,
    itemType: item.itemType,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  }));

  const quoteData: Prisma.QuoteCreateInput = {
    documentId: d.documentId,
    quoteNumber,
    status: d.status ?? "rascunho",
    client: { connect: { id: d.clientId } },
    ...(d.bodyModelId ? { bodyModel: { connect: { id: d.bodyModelId } } } : {}),
    lengthM: d.lengthM,
    widthM: d.widthM,
    heightM: d.heightM,
    coverStyle: d.coverStyle,
    floorType: d.floorType,
    finishType: d.finishType,
    optionsJson: d.options ?? [],
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    total: pricing.total,
    marginPercent: pricing.marginPercent,
    paymentTerms: d.paymentTerms,
    deliveryDays: d.deliveryDays,
    notes: d.notes,
    validUntil,
    ...(createdByUserId ? { createdBy: { connect: { id: createdByUserId } } } : {}),
    items: { create: items },
  };

  return { quoteData, items };
}

export function quoteIsEditable(status: string): boolean {
  return status === "rascunho" || status === "enviado";
}

export function canTransitionQuoteStatus(from: string, to: string): boolean {
  if (from === to) return true;
  const allowed: Record<string, string[]> = {
    rascunho: ["enviado", "cancelado"],
    enviado: ["aprovado", "rascunho", "cancelado"],
    aprovado: ["convertido"],
    convertido: [],
    cancelado: [],
  };
  return (allowed[from] ?? []).includes(to);
}
