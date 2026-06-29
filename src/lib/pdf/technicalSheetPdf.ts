import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ensureFontsRegistered } from "@/lib/pdf/registerFonts";
import { TechnicalSheetDocument } from "@/lib/pdf/templates/TechnicalSheetDocument";
import type { TechnicalSheetPdfViewModel } from "@/lib/pdf/templates/types";
import type { IssuerSettings } from "@/lib/pdf/contractPdf";
import type { BomLine } from "@/lib/quotes/bomBuilder";
import { COVER_STYLE_LABELS, type BodyCoverStyle } from "@/types/quotes";

export type TechnicalSheetWithQuote = {
  id: number;
  sheetNumber?: string | null;
  bomJson: unknown;
  notes?: string | null;
  createdAt: Date;
  quote: {
    quoteNumber?: string | null;
    lengthM: unknown;
    widthM: unknown;
    heightM: unknown;
    coverStyle: BodyCoverStyle;
    client: { fullName: string };
  };
};

function dec(v: unknown): number {
  if (typeof v === "object" && v != null && "toString" in v) {
    return Number((v as { toString: () => string }).toString());
  }
  return Number(v ?? 0);
}

export function buildTechnicalSheetViewModel(
  sheet: TechnicalSheetWithQuote,
  issuer: IssuerSettings | null,
): TechnicalSheetPdfViewModel {
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
  const lines = Array.isArray(sheet.bomJson) ? (sheet.bomJson as BomLine[]) : [];

  return {
    sheetNumber: sheet.sheetNumber ?? `FT-${sheet.id}`,
    sheetDate: sheet.createdAt,
    quoteNumber: sheet.quote.quoteNumber ?? String(sheet.id),
    issuer: safeIssuer,
    clientName: sheet.quote.client.fullName,
    lengthM: dec(sheet.quote.lengthM),
    widthM: dec(sheet.quote.widthM),
    heightM: dec(sheet.quote.heightM),
    coverStyle: COVER_STYLE_LABELS[sheet.quote.coverStyle],
    lines: lines.map((l) => ({
      sku: l.sku,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      category: l.category,
    })),
    notes: sheet.notes,
  };
}

export async function renderTechnicalSheetPdf(
  sheet: TechnicalSheetWithQuote,
  issuer: IssuerSettings | null,
): Promise<Buffer> {
  ensureFontsRegistered();
  const vm = buildTechnicalSheetViewModel(sheet, issuer);
  const element = React.createElement(TechnicalSheetDocument, { vm });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
