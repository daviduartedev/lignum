export type QuoteStatus = "rascunho" | "enviado" | "aprovado" | "convertido" | "cancelado";

export type BodyCoverStyle = "tampa_plana" | "tampa_arqueada" | "tampa_basculante";

export type BodyFloorType = "assoalho_madeira" | "assoalho_aco" | "assoalho_aluminio";

export type BodyFinishType = "pintura" | "verniz" | "lamina_natural";

export interface QuoteItemAttributes {
  sort_order: number;
  item_type: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface QuoteAttributes {
  quote_number?: string;
  status: QuoteStatus;
  client_id: number;
  body_model_id?: number;
  length_m: number;
  width_m: number;
  height_m: number;
  cover_style: BodyCoverStyle;
  floor_type: BodyFloorType;
  finish_type: BodyFinishType;
  options: string[];
  subtotal: number;
  discount: number;
  total: number;
  margin_percent?: number;
  payment_terms?: string;
  delivery_days?: number;
  notes?: string;
  valid_until?: string;
  approved_at?: string;
  converted_at?: string;
  client?: {
    data?: {
      id: number;
      attributes: { full_name: string; document: string; email: string };
    };
  };
  body_model?: {
    data?: {
      id: number;
      attributes: { name: string; base_price: number };
    };
  };
  items?: QuoteItemAttributes[];
  technical_sheet?: {
    data?: {
      id: number;
      attributes: { sheet_number?: string; bom: unknown };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: number;
  documentId?: string;
  attributes: QuoteAttributes;
}

export interface BodyModelAttributes {
  name: string;
  description?: string;
  base_price: number;
  price_per_m2: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BodyModel {
  id: number;
  documentId?: string;
  attributes: BodyModelAttributes;
}

export function quoteAttrs(q: Quote): QuoteAttributes {
  const x = q as unknown as { attributes?: QuoteAttributes };
  if (x.attributes) return x.attributes;
  return q as unknown as QuoteAttributes;
}

export function bodyModelAttrs(m: BodyModel): BodyModelAttributes {
  const x = m as unknown as { attributes?: BodyModelAttributes };
  if (x.attributes) return x.attributes;
  return m as unknown as BodyModelAttributes;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  convertido: "Convertido",
  cancelado: "Cancelado",
};

export const COVER_STYLE_LABELS: Record<BodyCoverStyle, string> = {
  tampa_plana: "Tampa plana",
  tampa_arqueada: "Tampa arqueada",
  tampa_basculante: "Tampa basculante",
};

export const FLOOR_TYPE_LABELS: Record<BodyFloorType, string> = {
  assoalho_madeira: "Assoalho madeira",
  assoalho_aco: "Assoalho aço",
  assoalho_aluminio: "Assoalho alumínio",
};

export const FINISH_TYPE_LABELS: Record<BodyFinishType, string> = {
  pintura: "Pintura",
  verniz: "Verniz",
  lamina_natural: "Lâmina natural",
};
