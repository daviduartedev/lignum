import type { Supplier } from "@/types";

export function mapApiRowToSupplier(row: Record<string, unknown>): Supplier {
  const id = Number(row.id);
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
      company_name: String(row.companyName ?? ""),
      document: row.document != null ? String(row.document) : undefined,
      phone: row.phone != null ? String(row.phone) : undefined,
      email: row.email != null ? String(row.email) : undefined,
      notes: row.notes != null ? String(row.notes) : undefined,
      zip_code: row.zipCode != null ? String(row.zipCode) : undefined,
      neighborhood: row.neighborhood != null ? String(row.neighborhood) : undefined,
      street: row.street != null ? String(row.street) : undefined,
      city: row.city != null ? String(row.city) : undefined,
      street_number: row.streetNumber != null ? String(row.streetNumber) : undefined,
      address_complement: row.addressComplement != null ? String(row.addressComplement) : undefined,
      createdAt,
      updatedAt,
    },
  };
}
