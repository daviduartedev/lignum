import type { SenatranLookupInput, SenatranNormalizedVehicle } from "@/lib/senatran/types";
import { SenatranLookupError } from "@/lib/senatran/errors";
import { mapFuelLabelToFuelType } from "@/lib/senatran/mapFuel";
import { isValidBrazilPlate, normalizePlate, normalizeRenavamDigits } from "@/lib/senatran/normalize";

const PLATE_404 = "ZZZ9999";
const RENAVAM_OK = "12345678901";

function baseFixture(plate: string): SenatranNormalizedVehicle {
  return {
    plate,
    renavam: "12345678901",
    chassis: "9BWZZZ377VT004251",
    brand: "Toyota",
    model: "Corolla",
    yearManufacture: 2022,
    yearModel: 2023,
    color: "Prata",
    fuel: mapFuelLabelToFuelType("Flex"),
    categoryKind: "carro",
    speciesCategory: "Automóvel",
    registrationCity: "São Paulo",
    registrationUf: "SP",
    legalSituation: "regular",
    cautelar: "nao",
    listingTitleDefault: "Toyota Corolla",
    officialExtra: {
      "Tipo de documento": "CRLV",
      Restrições: "Nenhuma",
    },
  };
}

/** Payload bruto simulado (inclui PII fictício), só para auditoria, nunca para o DTO. */
export function mockRawSnapshotForAudit(plateNormalized: string): Record<string, unknown> {
  return {
    plate: plateNormalized,
    ownerCpf: "***REDACTED-SIMULATED***",
    rawVendorField: "exemplo",
  };
}

export async function mockLookup(input: SenatranLookupInput): Promise<{
  normalized: SenatranNormalizedVehicle;
  rawForAudit: Record<string, unknown>;
}> {
  if (input.plate?.trim()) {
    const n = normalizePlate(input.plate);
    if (!isValidBrazilPlate(n)) {
      throw new SenatranLookupError("PLATE_INVALID", "Placa com formato inválido.");
    }
    if (n === PLATE_404) {
      throw new SenatranLookupError("PLATE_NOT_FOUND", "Placa não encontrada na consulta.");
    }
    const normalized = baseFixture(n);
    return {
      normalized,
      rawForAudit: mockRawSnapshotForAudit(n),
    };
  }

  if (input.renavam?.trim()) {
    const d = normalizeRenavamDigits(input.renavam);
    if (d === RENAVAM_OK) {
      const normalized: SenatranNormalizedVehicle = {
        ...baseFixture("RENAVAM"),
        plate: "ABC1D23",
        renavam: d,
      };
      return {
        normalized,
        rawForAudit: { ...mockRawSnapshotForAudit("RENAVAM"), renavam: d },
      };
    }
    throw new SenatranLookupError(
      "RENAVAM_LOOKUP_NOT_SUPPORTED",
      "RENAVAM não localizado ou consulta por RENAVAM indisponível no modo demonstração.",
    );
  }

  throw new SenatranLookupError("PLATE_INVALID", "Informe a placa ou o RENAVAM.");
}
