// ============================================================
// TYPES, Alinhados 1:1 com os schemas do Strapi
// Convenção: campos do Strapi em snake_case são mapeados aqui
// ============================================================

// ----- Media -----
export interface StrapiMedia {
  id: number;
  url: string;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

// ----- Auth -----
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: { name: string };
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

// ----- Client -----
export type PersonType = "PF" | "PJ";

export interface ClientAttributes {
  full_name: string;
  document: string; // CPF ou CNPJ
  person_type?: PersonType;
  email: string;
  phone?: string;
  address?: string;
  rg?: string;
  marital_status?: string;
  profession?: string;
  zip_code?: string;
  nationality?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  street_number?: string;
  address_complement?: string;
  birth_date?: string;
  registration_status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  documentId?: string;
  attributes: ClientAttributes;
}

/** Atributos do cliente (Strapi v4 com `attributes` ou v5 plano no nó). */
export function clientAttrs(c: Client | Record<string, unknown>): ClientAttributes {
  const x = c as unknown as { attributes?: ClientAttributes };
  if (x.attributes) return x.attributes;
  return c as unknown as ClientAttributes;
}

// ----- Supplier (fornecedor) -----
export interface SupplierAttributes {
  company_name: string;
  document?: string;
  phone?: string;
  email?: string;
  notes?: string;
  zip_code?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  street_number?: string;
  address_complement?: string;
  registration_status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  documentId?: string;
  attributes: SupplierAttributes;
}

// ----- Client document (prontuário / CRM) -----
export interface ClientDocumentAttributes {
  title: string;
  notes?: string;
  external_url?: string;
  document_file?: { data: StrapiMedia | null };
  client?: { data: Client | null };
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument {
  id: number;
  documentId?: string;
  attributes: ClientDocumentAttributes;
}

// ----- Notificações in-app (Strapi user-notification) -----
export interface UserNotification {
  id: string;
  documentId?: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  /** Data/hora do lembrete (calendário); opcional para avisos só na central. */
  remind_at?: string;
  createdAt: string;
}

// ----- Strapi List Response -----
export interface StrapiList<T> {
  data: T[];
  meta: {
    pagination: { page: number; pageSize: number; pageCount: number; total: number };
  };
}

export interface StrapiSingle<T> {
  data: T;
}
