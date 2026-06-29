import { describe, expect, it } from "vitest";
import { calculateQuotePricing } from "@/lib/quotes/pricingEngine";
import { DEFAULT_QUOTE_PRICING } from "@/lib/quotes/quotePricingDefaults";

describe("calculateQuotePricing", () => {
  it("calcula total base com modelo padrão", () => {
    const result = calculateQuotePricing({
      basePrice: 18000,
      pricePerM2: 120,
      lengthM: 4.2,
      widthM: 2.1,
      heightM: 1.8,
      coverStyle: "tampa_plana",
      floorType: "assoalho_madeira",
      finishType: "pintura",
      options: [],
      pricing: DEFAULT_QUOTE_PRICING,
    });

    expect(result.subtotal).toBeGreaterThan(18000);
    expect(result.total).toBe(result.subtotal);
    expect(result.items.some((i) => i.itemType === "labor")).toBe(true);
  });

  it("aplica sobretaxas de tampa, assoalho e acabamento", () => {
    const plain = calculateQuotePricing({
      basePrice: 10000,
      pricePerM2: 0,
      lengthM: 3,
      widthM: 2,
      heightM: 1.5,
      coverStyle: "tampa_plana",
      floorType: "assoalho_madeira",
      finishType: "pintura",
      options: [],
      pricing: DEFAULT_QUOTE_PRICING,
    });
    const premium = calculateQuotePricing({
      basePrice: 10000,
      pricePerM2: 0,
      lengthM: 3,
      widthM: 2,
      heightM: 1.5,
      coverStyle: "tampa_basculante",
      floorType: "assoalho_aluminio",
      finishType: "verniz",
      options: [],
      pricing: DEFAULT_QUOTE_PRICING,
    });

    expect(premium.total).toBeGreaterThan(plain.total);
  });

  it("soma opcionais e desconto", () => {
    const base = calculateQuotePricing({
      basePrice: 10000,
      pricePerM2: 0,
      lengthM: 3,
      widthM: 2,
      heightM: 1.5,
      coverStyle: "tampa_plana",
      floorType: "assoalho_madeira",
      finishType: "pintura",
      options: ["porta_lateral", "iluminacao_led"],
      pricing: DEFAULT_QUOTE_PRICING,
    });
    const withDiscount = calculateQuotePricing({
      basePrice: 10000,
      pricePerM2: 0,
      lengthM: 3,
      widthM: 2,
      heightM: 1.5,
      coverStyle: "tampa_plana",
      floorType: "assoalho_madeira",
      finishType: "pintura",
      options: ["porta_lateral", "iluminacao_led"],
      discount: 500,
      pricing: DEFAULT_QUOTE_PRICING,
    });

    expect(base.total - withDiscount.total).toBe(500);
    expect(withDiscount.items.filter((i) => i.itemType === "option")).toHaveLength(2);
  });
});
