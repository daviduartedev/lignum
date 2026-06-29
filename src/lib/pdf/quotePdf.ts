import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ensureFontsRegistered } from "@/lib/pdf/registerFonts";
import { QuoteDocument } from "@/lib/pdf/templates/QuoteDocument";
import type { QuotePdfViewModel } from "@/lib/pdf/templates/types";
import type { IssuerSettings } from "@/lib/pdf/contractPdf";
import {
  COVER_STYLE_LABELS,
  FINISH_TYPE_LABELS,
  FLOOR_TYPE_LABELS,
  type BodyCoverStyle,
  type BodyFinishType,
  type BodyFloorType,
} from "@/types/quotes";

export type QuoteWithRelations = {
  id: number;
  documentId?: string | null;
  quoteNumber?: string | null;
  createdAt: Date;
  validUntil?: Date | null;
  lengthM: unknown;
  widthM: unknown;
  heightM: unknown;
  coverStyle: BodyCoverStyle;
  floorType: BodyFloorType;
  finishType: BodyFinishType;
  subtotal: unknown;
  discount: unknown;
  total: unknown;
  paymentTerms?: string | null;
  deliveryDays?: number | null;
  notes?: string | null;
  client: { fullName: string; document: string; email?: string | null };
  items: Array<{
    description: string;
    quantity: unknown;
    unitPrice: unknown;
    totalPrice: unknown;
  }>;
};

function dec(v: unknown): number {
  if (typeof v === "object" && v != null && "toString" in v) {
    return Number((v as { toString: () => string }).toString());
  }
  return Number(v ?? 0);
}

export function buildQuoteViewModel(
  quote: QuoteWithRelations,
  issuer: IssuerSettings | null,
): QuotePdfViewModel {
  const safeIssuer = issuer ?? {
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

  return {
    quoteNumber: quote.quoteNumber ?? quote.documentId ?? String(quote.id),
    quoteDate: quote.createdAt,
    validUntil: quote.validUntil,
    issuer: safeIssuer,
    clientName: quote.client.fullName,
    clientDocument: quote.client.document,
    clientEmail: quote.client.email,
    lengthM: dec(quote.lengthM),
    widthM: dec(quote.widthM),
    heightM: dec(quote.heightM),
    coverStyle: COVER_STYLE_LABELS[quote.coverStyle],
    floorType: FLOOR_TYPE_LABELS[quote.floorType],
    finishType: FINISH_TYPE_LABELS[quote.finishType],
    items: quote.items.map((i) => ({
      description: i.description,
      quantity: dec(i.quantity),
      unitPrice: dec(i.unitPrice),
      totalPrice: dec(i.totalPrice),
    })),
    subtotal: dec(quote.subtotal),
    discount: dec(quote.discount),
    total: dec(quote.total),
    paymentTerms: quote.paymentTerms,
    deliveryDays: quote.deliveryDays,
    notes: quote.notes,
  };
}

export async function renderQuotePdf(
  quote: QuoteWithRelations,
  issuer: IssuerSettings | null,
): Promise<Buffer> {
  ensureFontsRegistered();
  const vm = buildQuoteViewModel(quote, issuer);
  const element = React.createElement(QuoteDocument, { vm });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
