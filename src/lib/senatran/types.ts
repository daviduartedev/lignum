import type {
  FuelType,
  VehicleCautelar,
  VehicleCategoryKind,
  VehicleLegalSituation,
} from "@prisma/client";

/** DTO seguro para o cliente (sem dados de titular). */
export type SenatranNormalizedVehicle = {
  plate: string;
  renavam: string;
  chassis: string;
  brand: string;
  model: string;
  yearManufacture: number;
  yearModel: number;
  color?: string;
  fuel?: FuelType;
  categoryKind: VehicleCategoryKind;
  speciesCategory?: string;
  registrationCity?: string;
  registrationUf?: string;
  legalSituation: VehicleLegalSituation;
  cautelar: VehicleCautelar;
  listingTitleDefault: string;
  officialExtra: Record<string, string>;
};

export type SenatranLookupInput = {
  plate?: string;
  renavam?: string;
};
