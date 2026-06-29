import type { BodyCoverStyle, BodyFinishType, BodyFloorType } from "@prisma/client";
import {
  DEFAULT_QUOTE_PRICING,
  type QuotePricingSettings,
} from "@/lib/quotes/quotePricingDefaults";

export type PricingInput = {
  bodyModelName?: string;
  basePrice: number;
  pricePerM2: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  coverStyle: BodyCoverStyle;
  floorType: BodyFloorType;
  finishType: BodyFinishType;
  options: string[];
  discount?: number;
  pricing?: QuotePricingSettings;
};

export type PricingLineItem = {
  itemType: "material" | "labor" | "option";
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

export type PricingResult = {
  items: PricingLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  marginPercent: number;
  floorAreaM2: number;
  wallAreaM2: number;
};

const COVER_LABELS: Record<BodyCoverStyle, string> = {
  tampa_plana: "Tampa plana",
  tampa_arqueada: "Tampa arqueada",
  tampa_basculante: "Tampa basculante",
};

const FLOOR_LABELS: Record<BodyFloorType, string> = {
  assoalho_madeira: "Assoalho madeira",
  assoalho_aco: "Assoalho aço",
  assoalho_aluminio: "Assoalho alumínio",
};

const FINISH_LABELS: Record<BodyFinishType, string> = {
  pintura: "Acabamento pintura",
  verniz: "Acabamento verniz",
  lamina_natural: "Acabamento lâmina natural",
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateQuotePricing(input: PricingInput): PricingResult {
  const pricing = input.pricing ?? DEFAULT_QUOTE_PRICING;
  const discount = Math.max(0, input.discount ?? 0);
  const floorAreaM2 = round2(input.lengthM * input.widthM);
  const wallAreaM2 = round2(2 * (input.lengthM + input.widthM) * input.heightM);
  const items: PricingLineItem[] = [];

  const modelLabel = input.bodyModelName ? `Modelo ${input.bodyModelName}` : "Carroceria base";
  items.push({
    itemType: "material",
    description: modelLabel,
    quantity: 1,
    unit: "un",
    unitPrice: round2(input.basePrice),
    totalPrice: round2(input.basePrice),
  });

  if (input.pricePerM2 > 0 && floorAreaM2 > 0) {
    const areaCost = round2(floorAreaM2 * input.pricePerM2);
    items.push({
      itemType: "material",
      description: `Área útil (${floorAreaM2} m²)`,
      quantity: floorAreaM2,
      unit: "m²",
      unitPrice: round2(input.pricePerM2),
      totalPrice: areaCost,
    });
  }

  const coverSurcharge = pricing.coverSurcharges[input.coverStyle] ?? 0;
  if (coverSurcharge > 0) {
    items.push({
      itemType: "material",
      description: COVER_LABELS[input.coverStyle],
      quantity: 1,
      unit: "un",
      unitPrice: coverSurcharge,
      totalPrice: coverSurcharge,
    });
  }

  const floorSurcharge = pricing.floorSurcharges[input.floorType] ?? 0;
  if (floorSurcharge > 0) {
    items.push({
      itemType: "material",
      description: FLOOR_LABELS[input.floorType],
      quantity: 1,
      unit: "un",
      unitPrice: floorSurcharge,
      totalPrice: floorSurcharge,
    });
  }

  const finishSurcharge = pricing.finishSurcharges[input.finishType] ?? 0;
  if (finishSurcharge > 0) {
    items.push({
      itemType: "material",
      description: FINISH_LABELS[input.finishType],
      quantity: 1,
      unit: "un",
      unitPrice: finishSurcharge,
      totalPrice: finishSurcharge,
    });
  }

  for (const key of input.options) {
    const opt = pricing.options[key];
    if (!opt) continue;
    items.push({
      itemType: "option",
      description: opt.label,
      quantity: 1,
      unit: "un",
      unitPrice: opt.price,
      totalPrice: opt.price,
    });
  }

  const laborHours = round2(Math.max(8, wallAreaM2 * 0.35));
  const laborCost = round2(laborHours * pricing.laborHourRate);
  items.push({
    itemType: "labor",
    description: `Mão de obra (${laborHours} h)`,
    quantity: laborHours,
    unit: "h",
    unitPrice: pricing.laborHourRate,
    totalPrice: laborCost,
  });

  const subtotal = round2(items.reduce((s, i) => s + i.totalPrice, 0));
  const total = round2(Math.max(0, subtotal - discount));
  const costBase = round2(subtotal * (1 - pricing.suggestedMarginPercent / 100));
  const marginPercent =
    total > 0 ? round2(((total - costBase) / total) * 100) : pricing.suggestedMarginPercent;

  return {
    items,
    subtotal,
    discount,
    total,
    marginPercent,
    floorAreaM2,
    wallAreaM2,
  };
}
