import type { Client, PromissoryNote, Vehicle } from "@/types";

function dec(n: unknown): number {
  if (typeof n === "object" && n != null && "toString" in n) {
    return Number((n as { toString: () => string }).toString());
  }
  return Number(n ?? 0);
}

function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? "");
  return s.slice(0, 10);
}

export function mapApiRowToPromissoryNote(
  row: Record<string, unknown>,
  vehicleById: Map<number, Vehicle>,
  clientById: Map<number, Client>,
): PromissoryNote {
  const id = Number(row.id);
  const cid = Number(row.clientId);
  const vid = Number(row.vehicleId);
  const cli = clientById.get(cid);
  const veh = vehicleById.get(vid);

  const createdAt =
    row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt ?? "");
  const updatedAt =
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? createdAt);

  const pay = row.paymentDate;
  const paymentDate =
    pay instanceof Date
      ? pay.toISOString().slice(0, 10)
      : pay != null && String(pay).length > 0
        ? String(pay).slice(0, 10)
        : undefined;

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      installment_number: Number(row.installmentNumber ?? 1),
      total_installments: Number(row.totalInstallments ?? 1),
      due_date: isoDate(row.dueDate),
      amount: dec(row.amount),
      status: row.status as PromissoryNote["attributes"]["status"],
      payment_date: paymentDate,
      notes: row.notes != null ? String(row.notes) : undefined,
      client: { data: cli ?? null },
      vehicle: { data: veh ?? null },
      createdAt,
      updatedAt,
    },
  };
}
