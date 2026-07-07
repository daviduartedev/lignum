import { describe, expect, it } from "vitest";
import {
  computeWeightedAvgCost,
  materialBelowMinimum,
  round2,
  round4,
} from "@/lib/materials/stockMovement";

describe("computeWeightedAvgCost", () => {
  it("calcula média ponderada após entrada", () => {
    expect(computeWeightedAvgCost(10, 100, 10, 200)).toBe(150);
  });

  it("usa custo da entrada quando estoque era zero", () => {
    expect(computeWeightedAvgCost(0, 0, 5, 42.5)).toBe(42.5);
  });

  it("arredonda para 2 casas decimais", () => {
    const avg = computeWeightedAvgCost(3, 10.33, 2, 15.99);
    expect(avg).toBe(round2((3 * 10.33 + 2 * 15.99) / 5));
  });
});

describe("materialBelowMinimum", () => {
  it("detecta saldo abaixo do mínimo", () => {
    expect(materialBelowMinimum({ currentStock: 5, minStock: 10 })).toBe(true);
  });

  it("não alerta quando saldo igual ou acima do mínimo", () => {
    expect(materialBelowMinimum({ currentStock: 10, minStock: 10 })).toBe(false);
    expect(materialBelowMinimum({ currentStock: 15, minStock: 10 })).toBe(false);
  });
});

describe("round helpers", () => {
  it("round4 mantém precisão de estoque", () => {
    expect(round4(1.23456)).toBe(1.2346);
  });
});
