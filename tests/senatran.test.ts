import { describe, it, expect } from "vitest";
import { mockLookup } from "@/lib/senatran/mockProvider";
import { mapFuelLabelToFuelType } from "@/lib/senatran/mapFuel";
import { SenatranLookupError } from "@/lib/senatran/errors";
import { __clearSenatranCacheForTests, senatranCacheGet, senatranCacheSet } from "@/lib/senatran/cache";
import type { SenatranNormalizedVehicle } from "@/lib/senatran/types";

describe("mapFuelLabelToFuelType", () => {
  it("mapeia rótulos comuns em PT-BR", () => {
    expect(mapFuelLabelToFuelType("Flex")).toBe("flex");
    expect(mapFuelLabelToFuelType("Gasolina")).toBe("gasolina");
    expect(mapFuelLabelToFuelType("Diesel")).toBe("diesel");
    expect(mapFuelLabelToFuelType("Elétrico")).toBe("eletrico");
    expect(mapFuelLabelToFuelType("Híbrido")).toBe("hibrido");
  });

  it("devolve undefined para texto não reconhecido", () => {
    expect(mapFuelLabelToFuelType("combustível desconhecido")).toBeUndefined();
  });
});

describe("mockLookup", () => {
  it("retorna fixture para placa válida", async () => {
    const r = await mockLookup({ plate: "ABC1D23" });
    expect(r.normalized.brand).toBe("Toyota");
    expect(r.normalized.renavam).toMatch(/^\d{9,11}$/);
  });

  it("lança PLATE_NOT_FOUND para placa de teste ZZZ9999", async () => {
    await expect(mockLookup({ plate: "ZZZ9999" })).rejects.toMatchObject({
      code: "PLATE_NOT_FOUND",
    });
  });

  it("lança PLATE_INVALID para placa inválida", async () => {
    await expect(mockLookup({ plate: "INVALID" })).rejects.toMatchObject({
      code: "PLATE_INVALID",
    });
  });

  it("RENAVAM de demonstração retorna dados", async () => {
    const r = await mockLookup({ renavam: "12345678901" });
    expect(r.normalized.chassis).toHaveLength(17);
  });
});

describe("senatranCache", () => {
  it("armazena e devolve valor dentro do TTL", () => {
    __clearSenatranCacheForTests();
    const v = { plate: "ABC" } as SenatranNormalizedVehicle;
    senatranCacheSet("k", v, 3600);
    expect(senatranCacheGet("k")).toEqual(v);
  });
});
