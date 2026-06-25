import type { Client, Vehicle, Warranty } from "@/types";

function dec(n: unknown): number {
  if (typeof n === "object" && n != null && "toString" in n) {
    return Number((n as { toString: () => string }).toString());
  }
  return Number(n ?? 0);
}

function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").slice(0, 10);
}

export function mapApiRowToWarranty(
  row: Record<string, unknown>,
  vehicleById: Map<number, Vehicle>,
  clientById: Map<number, Client>,
): Warranty {
  const id = Number(row.id);
  const vid = Number(row.vehicleId);
  const cid = Number(row.clientId);
  const veh = vehicleById.get(vid);
  const cli = clientById.get(cid);

  const createdAt =
    row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? "");
  const updatedAt =
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? createdAt);

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      warranty_type: row.warrantyType as Warranty["attributes"]["warranty_type"],
      start_date: isoDate(row.startDate),
      end_date: isoDate(row.endDate),
      coverage_value: dec(row.coverageValue),
      status: row.status as Warranty["attributes"]["status"],
      notes: row.notes != null ? String(row.notes) : undefined,
      vehicle: { data: veh ?? null },
      client: { data: cli ?? null },
      createdAt,
      updatedAt,
    },
  };
}
