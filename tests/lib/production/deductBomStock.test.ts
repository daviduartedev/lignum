import { describe, expect, it } from "vitest";
import {
  aggregateBomQuantitiesBySku,
  BomSkuMissingError,
  BomStockInsufficientError,
  parseBomJson,
  validateBomAgainstMaterials,
} from "@/lib/production/deductBomStock";
import type { BomLine } from "@/lib/quotes/bomBuilder";

describe("parseBomJson", () => {
  it("ignora payload inválido", () => {
    expect(parseBomJson(null)).toEqual([]);
    expect(parseBomJson({})).toEqual([]);
  });

  it("aceita quantidade como string (JSON Prisma)", () => {
    const lines = parseBomJson([
      { sku: "TMP-PLN", description: "Tampa", quantity: "1", unit: "kit", category: "tampa" },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(1);
  });

  it("extrai linhas válidas", () => {
    const lines: BomLine[] = [
      { sku: "TMP-PLN", description: "Tampa", quantity: 1, unit: "kit", category: "tampa" },
    ];
    expect(parseBomJson(lines)).toEqual(lines);
  });
});

describe("aggregateBomQuantitiesBySku", () => {
  it("soma quantidades do mesmo SKU", () => {
    const map = aggregateBomQuantitiesBySku([
      { sku: "EST-PER", description: "a", quantity: 10, unit: "m", category: "estrutura" },
      { sku: "EST-PER", description: "b", quantity: 5.5, unit: "m", category: "estrutura" },
      { sku: "CON-PAR", description: "c", quantity: 1, unit: "kit", category: "consumivel" },
    ]);
    expect(map.get("EST-PER")).toBe(15.5);
    expect(map.get("CON-PAR")).toBe(1);
  });
});

describe("validateBomAgainstMaterials", () => {
  const materials = new Map([
    ["TMP-PLN", { id: 1, sku: "TMP-PLN", currentStock: 5 }],
    ["EST-PER", { id: 2, sku: "EST-PER", currentStock: 2 }],
  ]);

  it("detecta SKU ausente", () => {
    const qty = new Map([["MISSING", 1]]);
    const result = validateBomAgainstMaterials(qty, materials);
    expect(result.missingSkus).toEqual(["MISSING"]);
    expect(result.insufficient).toEqual([]);
  });

  it("detecta saldo insuficiente", () => {
    const qty = new Map([
      ["TMP-PLN", 3],
      ["EST-PER", 10],
    ]);
    const result = validateBomAgainstMaterials(qty, materials);
    expect(result.missingSkus).toEqual([]);
    expect(result.insufficient).toHaveLength(1);
    expect(result.insufficient[0]).toMatchObject({
      sku: "EST-PER",
      materialId: 2,
      available: 2,
      requested: 10,
    });
  });

  it("passa quando saldo suficiente", () => {
    const qty = new Map([["TMP-PLN", 1]]);
    const result = validateBomAgainstMaterials(qty, materials);
    expect(result.missingSkus).toEqual([]);
    expect(result.insufficient).toEqual([]);
  });
});

describe("BOM stock errors", () => {
  it("BomSkuMissingError expõe SKUs", () => {
    const err = new BomSkuMissingError(["OPT-FOO"]);
    expect(err.skus).toEqual(["OPT-FOO"]);
  });

  it("BomStockInsufficientError expõe itens", () => {
    const err = new BomStockInsufficientError([
      { sku: "EST-PER", materialId: 1, available: 0, requested: 5 },
    ]);
    expect(err.items).toHaveLength(1);
  });
});
