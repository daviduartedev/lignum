export type EmployeeDto = {
  id: number;
  documentId?: string;
  name: string;
  roleTitle: string;
  commissionPct?: number | null;
  isActive: boolean;
  userId?: number | null;
  userName?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedOrdersCount?: number;
  completedOrdersCount?: number;
};

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? new Date().toISOString());
}

function dec(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toNumber" in v) {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapApiRowToEmployee(row: Record<string, unknown>): EmployeeDto {
  const userRaw = row.user as Record<string, unknown> | undefined;
  const createdAt = iso(row.createdAt);
  return {
    id: Number(row.id),
    documentId: row.documentId != null ? String(row.documentId) : undefined,
    name: String(row.name ?? ""),
    roleTitle: String(row.roleTitle ?? ""),
    commissionPct: dec(row.commissionPct),
    isActive: Boolean(row.isActive ?? true),
    userId: row.userId != null ? Number(row.userId) : null,
    userName: userRaw?.name != null ? String(userRaw.name) : null,
    createdAt,
    updatedAt: iso(row.updatedAt) || createdAt,
    assignedOrdersCount:
      row.assignedOrdersCount != null ? Number(row.assignedOrdersCount) : undefined,
    completedOrdersCount:
      row.completedOrdersCount != null ? Number(row.completedOrdersCount) : undefined,
  };
}
