import type { BodyCoverStyle, BodyFinishType, BodyFloorType, Quote, QuoteItem } from "@prisma/client";
import {
  DEFAULT_QUOTE_PRICING,
  type QuotePricingSettings,
} from "@/lib/quotes/quotePricingDefaults";

export type BomLine = {
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  category: "estrutura" | "tampa" | "assoalho" | "acabamento" | "opcional" | "consumivel";
};

const COVER_BOM: Record<BodyCoverStyle, BomLine> = {
  tampa_plana: {
    sku: "TMP-PLN",
    description: "Kit tampa plana",
    quantity: 1,
    unit: "kit",
    category: "tampa",
  },
  tampa_arqueada: {
    sku: "TMP-ARQ",
    description: "Kit tampa arqueada",
    quantity: 1,
    unit: "kit",
    category: "tampa",
  },
  tampa_basculante: {
    sku: "TMP-BAS",
    description: "Kit tampa basculante + dobradiças",
    quantity: 1,
    unit: "kit",
    category: "tampa",
  },
};

const FLOOR_BOM: Record<BodyFloorType, BomLine> = {
  assoalho_madeira: {
    sku: "ASS-MAD",
    description: "Assoalho compensado naval",
    quantity: 1,
    unit: "m²",
    category: "assoalho",
  },
  assoalho_aco: {
    sku: "ASS-ACO",
    description: "Chapa assoalho aço 3mm",
    quantity: 1,
    unit: "m²",
    category: "assoalho",
  },
  assoalho_aluminio: {
    sku: "ASS-ALU",
    description: "Chapa assoalho alumínio",
    quantity: 1,
    unit: "m²",
    category: "assoalho",
  },
};

const FINISH_BOM: Record<BodyFinishType, BomLine> = {
  pintura: {
    sku: "ACB-PIN",
    description: "Tinta PU + primer",
    quantity: 1,
    unit: "lote",
    category: "acabamento",
  },
  verniz: {
    sku: "ACB-VER",
    description: "Verniz marítimo",
    quantity: 1,
    unit: "lote",
    category: "acabamento",
  },
  lamina_natural: {
    sku: "ACB-LAM",
    description: "Lâmina natural",
    quantity: 1,
    unit: "m²",
    category: "acabamento",
  },
};

function dec(v: unknown): number {
  if (typeof v === "object" && v != null && "toString" in v) {
    return Number((v as { toString: () => string }).toString());
  }
  return Number(v ?? 0);
}

export function buildBomFromQuote(
  quote: Quote & { items: QuoteItem[] },
  pricing: QuotePricingSettings = DEFAULT_QUOTE_PRICING,
): BomLine[] {
  const floorArea = round2(dec(quote.lengthM) * dec(quote.widthM));
  const wallArea = round2(2 * (dec(quote.lengthM) + dec(quote.widthM)) * dec(quote.heightM));
  const options = Array.isArray(quote.optionsJson)
    ? (quote.optionsJson as string[])
    : [];

  const lines: BomLine[] = [
    {
      sku: "EST-PER",
      description: "Perfis estruturais galvanizados",
      quantity: round2(wallArea * 1.2),
      unit: "m",
      category: "estrutura",
    },
    {
      sku: "EST-CHP",
      description: "Chapas laterais",
      quantity: wallArea,
      unit: "m²",
      category: "estrutura",
    },
    {
      ...COVER_BOM[quote.coverStyle],
    },
    {
      ...FLOOR_BOM[quote.floorType],
      quantity: floorArea,
    },
    {
      ...FINISH_BOM[quote.finishType],
      quantity: Math.max(1, round2(wallArea * 0.5)),
    },
    {
      sku: "CON-PAR",
      description: "Parafusos, rebites e selantes",
      quantity: 1,
      unit: "kit",
      category: "consumivel",
    },
  ];

  for (const key of options) {
    const opt = pricing.options[key];
    if (!opt) continue;
    lines.push({
      sku: `OPT-${key.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`,
      description: opt.label,
      quantity: 1,
      unit: "un",
      category: "opcional",
    });
  }

  for (const item of quote.items.filter((i) => i.itemType === "material")) {
    if (lines.some((l) => l.description === item.description)) continue;
    lines.push({
      sku: `ITM-${item.id}`,
      description: item.description,
      quantity: dec(item.quantity),
      unit: item.unit,
      category: "consumivel",
    });
  }

  return lines;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
