import { describe, it, expect } from "vitest";
import { bucketSalesCountsPerMonth, computeTopMarcas, normalizeBrandKey } from "@/lib/dashboard/commerceAggregates";
import { listConsecutiveSpMonthsOldestFirst } from "@/lib/dashboard/spCalendar";

describe("computeTopMarcas", () => {
  it("agrupa marcas ignorando maiúsculas e desempata alfabeticamente", () => {
    const rows = [{ brand: "Toyota" }, { brand: " honda " }, { brand: "Toyota" }, { brand: "Honda" }];
    expect(computeTopMarcas(rows, 5)).toEqual([
      { marca: "honda", vendasCount: 2 },
      { marca: "Toyota", vendasCount: 2 },
    ]);
  });

  it("ignora marcas vazias", () => {
    expect(computeTopMarcas([{ brand: "   " }, { brand: "Fiat" }], 5)).toEqual([{ marca: "Fiat", vendasCount: 1 }]);
  });

  it("limita ao top N", () => {
    const rows = [
      { brand: "A" },
      { brand: "B" },
      { brand: "C" },
      { brand: "D" },
      { brand: "E" },
      { brand: "F" },
    ];
    expect(computeTopMarcas(rows, 3)).toHaveLength(3);
  });
});

describe("normalizeBrandKey", () => {
  it("trim e minúsculas", () => {
    expect(normalizeBrandKey("  VW  ")).toBe("vw");
  });
});

describe("bucketSalesCountsPerMonth", () => {
  it("conta vendas só nos meses pedidos", () => {
    const months = [
      { y: 2026, m: 2 },
      { y: 2026, m: 3 },
      { y: 2026, m: 4 },
    ];
    const sales = [
      { saleDate: new Date(Date.UTC(2026, 2, 10)) },
      { saleDate: new Date(Date.UTC(2026, 2, 15)) },
      { saleDate: new Date(Date.UTC(2026, 0, 5)) },
    ];
    const out = bucketSalesCountsPerMonth(sales, months);
    expect(out).toEqual([
      { ano: 2026, mes: 2, vendasCount: 0 },
      { ano: 2026, mes: 3, vendasCount: 2 },
      { ano: 2026, mes: 4, vendasCount: 0 },
    ]);
  });
});

describe("listConsecutiveSpMonthsOldestFirst", () => {
  it("lista do mais antigo ao mais recente a partir do mês civil em São Paulo", () => {
    const now = new Date("2026-04-15T15:00:00.000Z");
    expect(listConsecutiveSpMonthsOldestFirst(now, 3)).toEqual([
      { y: 2026, m: 2 },
      { y: 2026, m: 3 },
      { y: 2026, m: 4 },
    ]);
  });
});
