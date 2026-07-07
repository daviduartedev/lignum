/**
 * View-models dos documentos PDF comerciais (orçamento / ficha técnica).
 */

export type PdfIssuer = {
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
  issuer: PdfIssuer;
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
  issuer: PdfIssuer;
  clientName: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  coverStyle: string;
  lines: TechnicalSheetPdfLine[];
  notes?: string | null;
};
