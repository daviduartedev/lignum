import type {
  ServiceOrder,
  ServiceOrderLaborLine,
  ServiceOrderPartLine,
  ServiceOrderStatus,
  ServiceOrderType,
  Vehicle,
} from "@/types";

function dec(raw: unknown): number {
  if (typeof raw === "object" && raw != null && "toString" in raw) {
    return Number((raw as { toString: () => string }).toString());
  }
  return Number(raw ?? 0);
}

function ymd(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  const s = String(d ?? "");
  return s.slice(0, 10);
}

export function mapApiRowToServiceOrder(
  row: Record<string, unknown>,
  vehicleById: Map<number, Vehicle>,
): ServiceOrder {
  const id = Number(row.id);
  const vid = Number(row.vehicleId);
  const veh = vehicleById.get(vid) ?? null;

  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? new Date().toISOString());
  const updatedAt =
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt ?? createdAt);

  const partsJson = row.partsJson as ServiceOrderPartLine[] | null | undefined;
  const laborJson = row.laborJson as ServiceOrderLaborLine[] | null | undefined;
  const photoUrls = Array.isArray(row.photoUrls) ? (row.photoUrls as string[]) : [];

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      workshop_name: String(row.workshopName ?? ""),
      service_type: row.serviceType as ServiceOrderType,
      service_type_other_text:
        row.serviceType === "outros" && row.serviceTypeOtherText != null
          ? String(row.serviceTypeOtherText)
          : undefined,
      status: row.status as ServiceOrderStatus,
      entry_date: ymd(row.entryDate),
      due_date: row.dueDate != null ? ymd(row.dueDate) : undefined,
      responsible: row.responsible != null ? String(row.responsible) : undefined,
      description: row.description != null ? String(row.description) : undefined,
      parts_json: Array.isArray(partsJson) ? partsJson : null,
      labor_json: Array.isArray(laborJson) ? laborJson : null,
      total_amount: dec(row.totalAmount),
      vehicle: { data: veh },
      photo_urls: photoUrls.length ? photoUrls : undefined,
      createdAt,
      updatedAt,
    },
  };
}
