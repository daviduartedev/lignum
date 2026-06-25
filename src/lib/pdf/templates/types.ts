/**
 * View-model dos documentos de contrato (cycle 0614).
 * Desacopla os templates React-PDF do schema Prisma.
 */

export type ContractIssuer = {
  companyName: string;
  companyTaxId: string;
  companyStateReg: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyPhone: string;
  companyEmail: string;
};

export type ContractPartyClient = {
  fullName: string;
  document: string;
  rg?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type ContractVehicleInfo = {
  brand: string;
  model: string;
  version?: string | null;
  yearManufacture: number;
  yearModel: number;
  plate: string;
  renavam?: string | null;
  chassis?: string | null;
  color?: string | null;
  mileage?: number | null;
};

export type ContractWitness = {
  name?: string | null;
  document?: string | null;
};

export type ContractViewModel = {
  contractNumber: string;
  contractDate: Date | string;
  contractValue: number | string;
  specialClauses?: string | null;
  issuer: ContractIssuer;
  client: ContractPartyClient;
  vehicle: ContractVehicleInfo;
  witnesses: ContractWitness[];
};
