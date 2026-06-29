import type {
  BodyCoverStyle,
  BodyFinishType,
  BodyFloorType,
  QuoteStatus,
} from "@/types/quotes";

function dec(raw: unknown): number {
  if (typeof raw === "object" && raw != null && "toString" in raw) {
    return Number((raw as { toString: () => string }).toString());
  }
  return Number(raw ?? 0);
}

function ymd(d: unknown): string | undefined {
  if (d == null) return undefined;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function iso(d: unknown): string | undefined {
  if (d == null) return undefined;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

export function mapApiRowToQuoteItem(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    sort_order: Number(row.sortOrder ?? 0),
    item_type: String(row.itemType ?? "material"),
    description: String(row.description ?? ""),
    quantity: dec(row.quantity),
    unit: String(row.unit ?? "un"),
    unit_price: dec(row.unitPrice),
    total_price: dec(row.totalPrice),
  };
}

export function mapApiRowToQuote(row: Record<string, unknown>) {
  const id = Number(row.id);
  const createdAt = iso(row.createdAt) ?? new Date().toISOString();
  const updatedAt = iso(row.updatedAt) ?? createdAt;
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const clientRaw = row.client as Record<string, unknown> | undefined;
  const bodyModelRaw = row.bodyModel as Record<string, unknown> | undefined;
  const technicalSheetRaw = row.technicalSheet as Record<string, unknown> | null | undefined;

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      quote_number: row.quoteNumber != null ? String(row.quoteNumber) : undefined,
      status: row.status as QuoteStatus,
      client_id: Number(row.clientId),
      body_model_id: row.bodyModelId != null ? Number(row.bodyModelId) : undefined,
      length_m: dec(row.lengthM),
      width_m: dec(row.widthM),
      height_m: dec(row.heightM),
      cover_style: row.coverStyle as BodyCoverStyle,
      floor_type: row.floorType as BodyFloorType,
      finish_type: row.finishType as BodyFinishType,
      options: Array.isArray(row.optionsJson) ? (row.optionsJson as string[]) : [],
      subtotal: dec(row.subtotal),
      discount: dec(row.discount),
      total: dec(row.total),
      margin_percent: row.marginPercent != null ? dec(row.marginPercent) : undefined,
      payment_terms: row.paymentTerms != null ? String(row.paymentTerms) : undefined,
      delivery_days: row.deliveryDays != null ? Number(row.deliveryDays) : undefined,
      notes: row.notes != null ? String(row.notes) : undefined,
      valid_until: ymd(row.validUntil),
      approved_at: iso(row.approvedAt),
      converted_at: iso(row.convertedAt),
      client: clientRaw
        ? {
            data: {
              id: Number(clientRaw.id),
              attributes: {
                full_name: String(clientRaw.fullName ?? ""),
                document: String(clientRaw.document ?? ""),
                email: String(clientRaw.email ?? ""),
              },
            },
          }
        : undefined,
      body_model: bodyModelRaw
        ? {
            data: {
              id: Number(bodyModelRaw.id),
              attributes: {
                name: String(bodyModelRaw.name ?? ""),
                base_price: dec(bodyModelRaw.basePrice),
              },
            },
          }
        : undefined,
      items: itemsRaw.map((i) => mapApiRowToQuoteItem(i as Record<string, unknown>)),
      technical_sheet: technicalSheetRaw
        ? {
            data: {
              id: Number(technicalSheetRaw.id),
              attributes: {
                sheet_number: technicalSheetRaw.sheetNumber != null ? String(technicalSheetRaw.sheetNumber) : undefined,
                bom: technicalSheetRaw.bomJson,
              },
            },
          }
        : undefined,
      createdAt,
      updatedAt,
    },
  };
}

export function mapApiRowToBodyModel(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      name: String(row.name ?? ""),
      description: row.description != null ? String(row.description) : undefined,
      base_price: dec(row.basePrice),
      price_per_m2: dec(row.pricePerM2),
      active: Boolean(row.active ?? true),
      createdAt: iso(row.createdAt) ?? new Date().toISOString(),
      updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
    },
  };
}
