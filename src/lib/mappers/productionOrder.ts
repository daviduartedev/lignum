import type { ProductionOrderStatus } from "@prisma/client";
import type { BomLine } from "@/lib/quotes/bomBuilder";

export type ProductionOrderDto = {
  id: number;
  documentId?: string;
  orderNumber?: string | null;
  quoteId: number;
  technicalSheetId: number;
  status: ProductionOrderStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  photoUrls: string[];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  quote?: {
    id: number;
    quoteNumber?: string | null;
    clientName: string;
    bodyModelName?: string | null;
    lengthM: number;
    widthM: number;
    heightM: number;
  };
  technicalSheet?: {
    id: number;
    sheetNumber?: string | null;
    bom: BomLine[];
  };
  employeeIds: number[];
  employees?: Array<{ id: number; name: string; roleTitle: string }>;
  stockMovements?: Array<{
    id: number;
    type: string;
    quantity: number;
    notes?: string | null;
    createdAt: string;
    material?: { id: number; sku: string; name: string; unit: string };
  }>;
};

function iso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function dec(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

export function mapApiRowToProductionOrder(row: Record<string, unknown>): ProductionOrderDto {
  const quoteRaw = row.quote as Record<string, unknown> | undefined;
  const clientRaw = quoteRaw?.client as Record<string, unknown> | undefined;
  const bodyModelRaw = quoteRaw?.bodyModel as Record<string, unknown> | undefined;
  const sheetRaw = row.technicalSheet as Record<string, unknown> | undefined;
  const employeesRaw = Array.isArray(row.employees) ? row.employees : [];
  const movementsRaw = Array.isArray(row.stockMovements) ? row.stockMovements : [];

  const createdAt = iso(row.createdAt) ?? new Date().toISOString();
  const updatedAt = iso(row.updatedAt) ?? createdAt;

  return {
    id: Number(row.id),
    documentId: row.documentId != null ? String(row.documentId) : undefined,
    orderNumber: row.orderNumber != null ? String(row.orderNumber) : null,
    quoteId: Number(row.quoteId),
    technicalSheetId: Number(row.technicalSheetId),
    status: row.status as ProductionOrderStatus,
    startedAt: iso(row.startedAt),
    completedAt: iso(row.completedAt),
    cancelledAt: iso(row.cancelledAt),
    photoUrls: Array.isArray(row.photoUrls) ? row.photoUrls.map(String) : [],
    notes: row.notes != null ? String(row.notes) : null,
    createdAt,
    updatedAt,
    quote: quoteRaw
      ? {
          id: Number(quoteRaw.id),
          quoteNumber: quoteRaw.quoteNumber != null ? String(quoteRaw.quoteNumber) : null,
          clientName: String(clientRaw?.fullName ?? ""),
          bodyModelName: bodyModelRaw?.name != null ? String(bodyModelRaw.name) : null,
          lengthM: dec(quoteRaw.lengthM),
          widthM: dec(quoteRaw.widthM),
          heightM: dec(quoteRaw.heightM),
        }
      : undefined,
    technicalSheet: sheetRaw
      ? {
          id: Number(sheetRaw.id),
          sheetNumber: sheetRaw.sheetNumber != null ? String(sheetRaw.sheetNumber) : null,
          bom: Array.isArray(sheetRaw.bomJson) ? (sheetRaw.bomJson as BomLine[]) : [],
        }
      : undefined,
    employeeIds: employeesRaw.map((e) => Number((e as Record<string, unknown>).employeeId)),
    employees: employeesRaw
      .map((e) => {
        const emp = (e as Record<string, unknown>).employee as Record<string, unknown> | undefined;
        if (!emp) return null;
        return {
          id: Number(emp.id),
          name: String(emp.name ?? ""),
          roleTitle: String(emp.roleTitle ?? ""),
        };
      })
      .filter((e): e is { id: number; name: string; roleTitle: string } => e != null),
    stockMovements:
      movementsRaw.length > 0
        ? movementsRaw.map((m) => {
            const mv = m as Record<string, unknown>;
            const mat = mv.material as Record<string, unknown> | undefined;
            return {
              id: Number(mv.id),
              type: String(mv.type),
              quantity: dec(mv.quantity),
              notes: mv.notes != null ? String(mv.notes) : null,
              createdAt: iso(mv.createdAt) ?? createdAt,
              material: mat
                ? {
                    id: Number(mat.id),
                    sku: String(mat.sku),
                    name: String(mat.name),
                    unit: String(mat.unit),
                  }
                : undefined,
            };
          })
        : undefined,
  };
}
