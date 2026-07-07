/** Dados do emitente (ERP settings) para PDFs comerciais. */
export type IssuerSettings = {
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

export const EMPTY_ISSUER: IssuerSettings = {
  companyName: "",
  companyTaxId: "",
  companyStateReg: "",
  companyAddress: "",
  companyCity: "",
  companyState: "",
  companyZip: "",
  companyPhone: "",
  companyEmail: "",
};
