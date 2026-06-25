import type { Client, Sale, Vehicle } from "@/types";

export function mapApiRowToSale(
  row: Record<string, unknown>,
  vehicleById: Map<number, Vehicle>,
  clientById: Map<number, Client>,
): Sale {
  const id = Number(row.id);
  const vid = Number(row.vehicleId);
  const cid = Number(row.clientId);
  const veh = vehicleById.get(vid);
  const cli = clientById.get(cid);

  const saleDate =
    row.saleDate instanceof Date
      ? row.saleDate.toISOString().slice(0, 10)
      : String(row.saleDate ?? "").slice(0, 10);
  const createdAt =
    row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? "");
  const updatedAt =
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? createdAt);

  const finalRaw = row.finalPrice;
  const finalNum =
    typeof finalRaw === "object" && finalRaw != null && "toString" in finalRaw
      ? Number((finalRaw as { toString: () => string }).toString())
      : Number(finalRaw ?? 0);

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      sale_date: saleDate,
      final_price: finalNum,
      payment_method: row.paymentMethod as Sale["attributes"]["payment_method"],
      financing_bank: row.financingBank != null ? String(row.financingBank) : undefined,
      seller_user_id: row.sellerUserId != null ? Number(row.sellerUserId) : undefined,
      seller_name: row.sellerName != null ? String(row.sellerName) : undefined,
      notes: row.notes != null ? String(row.notes) : undefined,
      vehicle: { data: veh ?? null },
      client: { data: cli ?? null },
      createdAt,
      updatedAt,
    },
  };
}
