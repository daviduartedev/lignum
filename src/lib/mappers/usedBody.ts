import type { UsedBody, UsedBodyCondition, UsedBodyStatus } from "@prisma/client";

export type UsedBodyDto = {
  id: number;
  documentId?: string;
  title: string;
  lengthM: number;
  widthM: number;
  heightM?: number | null;
  condition: UsedBodyCondition;
  entryValue: number;
  saleValue?: number | null;
  status: UsedBodyStatus;
  observations?: string | null;
  mainPhotoUrl?: string | null;
  galleryUrls: string[];
  supplierId?: number | null;
  supplier?: { id: number; companyName: string } | null;
  createdAt: string;
  updatedAt: string;
};

function dec(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

export function mapApiRowToUsedBody(row: Record<string, unknown>): UsedBodyDto {
  const supplierRaw = row.supplier as Record<string, unknown> | null | undefined;
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
    title: String(row.title ?? ""),
    lengthM: dec(row.lengthM),
    widthM: dec(row.widthM),
    heightM: row.heightM != null ? dec(row.heightM) : null,
    condition: row.condition as UsedBodyCondition,
    entryValue: dec(row.entryValue),
    saleValue: row.saleValue != null ? dec(row.saleValue) : null,
    status: row.status as UsedBodyStatus,
    observations: row.observations != null ? String(row.observations) : null,
    mainPhotoUrl: row.mainPhotoUrl != null ? String(row.mainPhotoUrl) : null,
    galleryUrls: Array.isArray(row.galleryUrls) ? row.galleryUrls.map(String) : [],
    supplierId: row.supplierId != null ? Number(row.supplierId) : null,
    supplier: supplierRaw
      ? { id: Number(supplierRaw.id), companyName: String(supplierRaw.companyName ?? "") }
      : null,
    createdAt,
    updatedAt,
  };
}

export function mapPrismaUsedBody(row: UsedBody & { supplier?: { id: number; companyName: string } | null }): UsedBodyDto {
  return mapApiRowToUsedBody(row as unknown as Record<string, unknown>);
}
