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

export type QuotePdfItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type QuotePdfViewModel = {
  quoteNumber: string;
  quoteDate: Date | string;
  validUntil?: Date | string | null;
  issuer: ContractIssuer;
  clientName: string;
  clientDocument: string;
  clientEmail?: string | null;
  lengthM: number;
  widthM: number;
  heightM: number;
  coverStyle: string;
  floorType: string;
  finishType: string;
  items: QuotePdfItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  notes?: string | null;
};

export type TechnicalSheetPdfLine = {
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
};

export type TechnicalSheetPdfViewModel = {
  sheetNumber: string;
  sheetDate: Date | string;
  quoteNumber: string;
  issuer: ContractIssuer;
  clientName: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  coverStyle: string;
  lines: TechnicalSheetPdfLine[];
  notes?: string | null;
};
