import type { Material, MaterialCategory } from "@prisma/client";

export type MaterialDto = {
  id: number;
  documentId?: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  minStock: number;
  avgCost: number;
  currentStock: number;
  supplierId?: number | null;
  supplier?: { id: number; companyName: string } | null;
  belowMinimum: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementDto = {
  id: number;
  materialId: number;
  type: string;
  quantity: number;
  unitCost?: number | null;
  productionOrderId?: number | null;
  notes?: string | null;
  createdByUserId?: number | null;
  createdAt: string;
  material?: MaterialDto;
  createdBy?: { id: number; name: string | null; email: string } | null;
};

function dec(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

export function mapApiRowToMaterial(row: Record<string, unknown>): MaterialDto {
  const supplierRaw = row.supplier as Record<string, unknown> | null | undefined;
  const currentStock = dec(row.currentStock);
  const minStock = dec(row.minStock);
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? new Date().toISOString());
  const updatedAt =
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt ?? createdAt);

  return {
    id: Number(row.id),
    documentId: row.documentId != null ? String(row.documentId) : undefined,
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    category: row.category as MaterialCategory,
    unit: String(row.unit ?? "un"),
    minStock,
    avgCost: dec(row.avgCost),
    currentStock,
    supplierId: row.supplierId != null ? Number(row.supplierId) : null,
    supplier: supplierRaw
      ? { id: Number(supplierRaw.id), companyName: String(supplierRaw.companyName ?? "") }
      : null,
    belowMinimum: currentStock < minStock,
    createdAt,
    updatedAt,
  };
}

export function mapApiRowToStockMovement(row: Record<string, unknown>): StockMovementDto {
  const materialRaw = row.material as Record<string, unknown> | undefined;
  const createdByRaw = row.createdBy as Record<string, unknown> | null | undefined;
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? new Date().toISOString());

  return {
    id: Number(row.id),
    materialId: Number(row.materialId),
    type: String(row.type ?? ""),
    quantity: dec(row.quantity),
    unitCost: row.unitCost != null ? dec(row.unitCost) : null,
    productionOrderId: row.productionOrderId != null ? Number(row.productionOrderId) : null,
    notes: row.notes != null ? String(row.notes) : null,
    createdByUserId: row.createdByUserId != null ? Number(row.createdByUserId) : null,
    createdAt,
    material: materialRaw ? mapApiRowToMaterial(materialRaw) : undefined,
    createdBy: createdByRaw
      ? {
          id: Number(createdByRaw.id),
          name: createdByRaw.name != null ? String(createdByRaw.name) : null,
          email: String(createdByRaw.email ?? ""),
        }
      : null,
  };
}

export function mapPrismaMaterial(row: Material & { supplier?: { id: number; companyName: string } | null }): MaterialDto {
  return mapApiRowToMaterial(row as unknown as Record<string, unknown>);
}
