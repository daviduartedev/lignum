export type DocumentLookupPersonType = "PJ";

export type DocumentLookupNormalized = {
  personType: DocumentLookupPersonType;
  fullName: string;
  tradeName?: string;
  registrationStatus?: string;
  email?: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  address?: string;
};

export type DocumentLookupInput = {
  document: string;
};

export type DocumentLookupProviderResult = {
  normalized: DocumentLookupNormalized;
  rawForAudit: Record<string, unknown>;
};
