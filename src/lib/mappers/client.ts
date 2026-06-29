import type { Client } from "@/types";

export function mapApiRowToClient(row: Record<string, unknown>): Client {
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
      full_name: String(row.fullName ?? ""),
      document: String(row.document ?? ""),
      person_type:
        row.personType === "pf" || row.personType === "PF"
          ? "PF"
          : row.personType === "pj" || row.personType === "PJ"
            ? "PJ"
            : undefined,
      email: String(row.email ?? ""),
      phone: row.phone != null ? String(row.phone) : undefined,
      address: row.address != null ? String(row.address) : undefined,
      rg: row.rg != null ? String(row.rg) : undefined,
      marital_status: row.maritalStatus != null ? String(row.maritalStatus) : undefined,
      profession: row.profession != null ? String(row.profession) : undefined,
      zip_code: row.zipCode != null ? String(row.zipCode) : undefined,
      nationality: row.nationality != null ? String(row.nationality) : undefined,
      neighborhood: row.neighborhood != null ? String(row.neighborhood) : undefined,
      street: row.street != null ? String(row.street) : undefined,
      city: row.city != null ? String(row.city) : undefined,
      street_number: row.streetNumber != null ? String(row.streetNumber) : undefined,
      address_complement: row.addressComplement != null ? String(row.addressComplement) : undefined,
      birth_date:
        row.birthDate instanceof Date
          ? row.birthDate.toISOString().slice(0, 10)
          : row.birthDate != null
            ? String(row.birthDate).slice(0, 10)
            : undefined,
      registration_status:
        row.registrationStatus != null ? String(row.registrationStatus) : undefined,
      createdAt,
      updatedAt,
    },
  };
}
