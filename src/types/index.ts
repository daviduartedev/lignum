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

// ----- Vehicle -----
export type VehicleStatus =
  | 'disponivel'
  | 'repasse'
  | 'reservado'
  | 'vendido'
  | 'removido'
  | 'standby_nao_compra';

export type FuelType = 'flex' | 'gasolina' | 'diesel' | 'eletrico' | 'hibrido';
export type TransmissionType = 'manual' | 'automatico' | 'cvt';

export type VehicleLegalSituation = 'regular' | 'irregular' | 'com_restricao';
export type VehicleCategoryKind = 'carro' | 'moto' | 'onibus' | 'jet_ski' | 'outros';
export type VehicleCautelar =
  | 'nao'
  | 'leilao'
  | 'sinistro'
  | 'leilao_sinistro'
  | 'outras_restricoes';

/** Shape que vem da API Strapi (dentro de .data[].attributes) */
export interface VehicleAttributes {
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year_manufacture: number;
  year_model: number;
  mileage: number;
  color?: string;
  fuel?: FuelType;
  transmission?: TransmissionType;
  fipe_price?: number; // private: true, nunca exibir publicamente
  purchase_price: number; // private: true
  estimated_maintenance_cost?: number;
  selling_price?: number;
  /** Preço mínimo de venda (informativo; não bloqueia venda neste ciclo). */
  minimum_selling_price?: number;
  status: VehicleStatus;
  observations?: string;
  doors_count?: number;
  /** Date-only string (YYYY-MM-DD) when available. */
  last_licensing_date?: string;
  /** ISO string when available. */
  purchase_entry_at?: string;
  purchase_entry_mileage?: number;
  purchase_supplier_id?: number;
  purchase_payment_json?: unknown;
  renavam?: string;
  chassis?: string;
  legal_situation?: VehicleLegalSituation;
  category_kind?: VehicleCategoryKind;
  cautelar?: VehicleCautelar;
  species_category?: string;
  registration_city?: string;
  registration_uf?: string;
  listing_title?: string;
  /** Curadoria da vitrine (cycle 0618): aparece quando modo=selecionados. */
  show_in_storefront?: boolean;
  official_extra_fields?: Record<string, string>;
  senatran_field_provenance?: Record<string, 'senatran' | 'manual'>;
  main_photo?: { data: StrapiMedia | null };
  gallery?: { data: StrapiMedia[] };
  attachments?: { data: StrapiMedia[] };
  buyer?: { data: ClientAttributes | null };
  sale?: { data: SaleAttributes | null };
  createdAt: string;
  updatedAt: string;
}

/** Wrapper padrão do Strapi */
export interface Vehicle {
  id: number;
  documentId?: string;
  attributes: VehicleAttributes;
}

/** Atributos do veículo (Strapi v4 com `attributes` ou formato mais plano). */
export function vehicleAttrs(v: Vehicle): VehicleAttributes {
  const x = v as unknown as { attributes?: VehicleAttributes };
  if (x.attributes) return x.attributes;
  return v as unknown as VehicleAttributes;
}

/** Helper: nome de exibição completo */
export function vehicleDisplayName(v: Vehicle): string {
  const a = vehicleAttrs(v);
  return [a.brand, a.model, a.version].filter(Boolean).join(' ');
}

/** Helper: dias em estoque */
export function vehicleDaysInStock(v: Vehicle): number {
  const a = vehicleAttrs(v);
  const created = new Date(a.createdAt || Date.now());
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/** Helper: URL da foto principal */
export function vehicleMainPhoto(v: Vehicle): string | undefined {
  const a = vehicleAttrs(v);
  const mp = a.main_photo as { data?: StrapiMedia | null; url?: string } | undefined;
  return mp?.data?.url || mp?.url;
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
  // Relacionamentos híbridos v4/v5 mapeados (usados para cálculos nos KPIs)
  sales?: { data?: { id: number; attributes: SaleAttributes }[] } | Partial<SaleAttributes>[];
  bought_vehicle?: { data?: { id: number; attributes: VehicleAttributes } } | Partial<VehicleAttributes>;
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

// ----- Sale -----
export type PaymentMethod =
  | 'financiamento'
  | 'a_vista'
  | 'cartao'
  | 'troca'
  | 'pix'
  | 'promissoria';

export interface SaleAttributes {
  sale_date: string;
  final_price: number;
  payment_method?: PaymentMethod;
  /** Banco financiador quando `payment_method` = financiamento (texto curto). */
  financing_bank?: string;
  seller_user_id?: number;
  seller_name?: string;
  notes?: string;
  vehicle?: { data: Vehicle | null };
  client?: { data: Client | null };
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  documentId?: string;
  attributes: SaleAttributes;
}

// ----- Evaluation -----
export interface EvaluationAttributes {
  score?: number;
  observations?: string;
  technical_notes?: string;
  /** Checklist técnico (itens booleanos); substitui o trecho embutido em `technical_notes` nas avaliações antigas */
  checklist_json?: unknown;
  /** URLs de fotos (Prisma `photoUrls` / migração Next). */
  photo_urls?: string[];
  photos?: { data: StrapiMedia[] };
  vehicle?: { data: Vehicle | null };
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: number;
  documentId?: string;
  attributes: EvaluationAttributes;
}

// ----- Contract -----
export type ContractType =
  | 'compra_venda'
  | 'financiamento'
  | 'consorcio'
  | 'locacao';

export type ContractStatus =
  | 'rascunho'
  | 'pendente_assinatura'
  | 'assinado'
  | 'cancelado';

export interface ContractAttributes {
  contract_type: ContractType;
  contract_value: number;
  contract_date: string;
  status: ContractStatus;
  special_clauses?: string;
  witness_1_name?: string;
  witness_1_document?: string;
  witness_2_name?: string;
  witness_2_document?: string;
  vehicle?: { data: Vehicle | null };
  client?: { data: Client | null };
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: number;
  documentId?: string;
  attributes: ContractAttributes;
}

// ----- Service order (OS) -----
export type ServiceOrderType =
  | 'manutencao'
  | 'revisao'
  | 'funilaria'
  | 'eletrica'
  | 'mecanica'
  | 'estetica'
  | 'outros';

export type ServiceOrderStatus = 'aguardando' | 'andamento' | 'concluida' | 'cancelada';

export interface ServiceOrderPartLine {
  descricao: string;
  quantidade: number;
  valor_unit: number;
  valor_total: number;
}

export interface ServiceOrderLaborLine {
  descricao: string;
  horas: number;
  valor_hora: number;
  valor_total: number;
}

export interface ServiceOrderAttributes {
  workshop_name: string;
  service_type: ServiceOrderType;
  service_type_other_text?: string;
  status: ServiceOrderStatus;
  entry_date: string;
  due_date?: string;
  responsible?: string;
  description?: string;
  parts_json?: ServiceOrderPartLine[] | null;
  labor_json?: ServiceOrderLaborLine[] | null;
  total_amount: number;
  vehicle?: { data: Vehicle | null };
  /** URLs em `photoUrls` (API Next). */
  photo_urls?: string[];
  photos?: { data: StrapiMedia[] };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: number;
  documentId?: string;
  attributes: ServiceOrderAttributes;
}

// ----- Warranty (garantias) -----
export type WarrantyType = 'motor_cambio' | 'completa' | 'motor' | 'acessorios' | 'outros';

export type WarrantyStatus = 'ativa' | 'vencendo' | 'expirada' | 'cancelada';

export interface WarrantyAttributes {
  warranty_type: WarrantyType;
  start_date: string;
  end_date: string;
  coverage_value: number;
  status: WarrantyStatus;
  notes?: string;
  vehicle?: { data: Vehicle | null };
  client?: { data: Client | null };
  createdAt: string;
  updatedAt: string;
}

export interface Warranty {
  id: number;
  documentId?: string;
  attributes: WarrantyAttributes;
}

// ----- Promissory note (promissórias / parcelas) -----
export type PromissoryNoteStatus = 'aberta' | 'paga' | 'vencida' | 'cancelada';

export interface PromissoryNoteAttributes {
  installment_number: number;
  total_installments: number;
  due_date: string;
  amount: number;
  status: PromissoryNoteStatus;
  payment_date?: string;
  notes?: string;
  client?: { data: Client | null };
  vehicle?: { data: Vehicle | null };
  createdAt: string;
  updatedAt: string;
}

export interface PromissoryNote {
  id: number;
  documentId?: string;
  attributes: PromissoryNoteAttributes;
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
