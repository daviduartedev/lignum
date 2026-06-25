import type { Client, Contract, ContractStatus, ContractType, Vehicle } from "@/types";

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

export function mapApiRowToContract(
  row: Record<string, unknown>,
  vehicleById: Map<number, Vehicle>,
  clientById: Map<number, Client>,
): Contract {
  const id = Number(row.id);
  const vid = Number(row.vehicleId);
  const cid = Number(row.clientId);
  const veh = vehicleById.get(vid) ?? null;
  const cli = clientById.get(cid) ?? null;

  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? new Date().toISOString());
  const updatedAt =
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt ?? createdAt);

  return {
    id,
    documentId: (row.documentId as string) ?? undefined,
    attributes: {
      contract_type: row.contractType as ContractType,
      contract_value: dec(row.contractValue),
      contract_date: ymd(row.contractDate),
      status: row.status as ContractStatus,
      special_clauses: row.specialClauses != null ? String(row.specialClauses) : undefined,
      witness_1_name: row.witness1Name != null ? String(row.witness1Name) : undefined,
      witness_1_document: row.witness1Document != null ? String(row.witness1Document) : undefined,
      witness_2_name: row.witness2Name != null ? String(row.witness2Name) : undefined,
      witness_2_document: row.witness2Document != null ? String(row.witness2Document) : undefined,
      vehicle: { data: veh },
      client: { data: cli },
      createdAt,
      updatedAt,
    },
  };
}
