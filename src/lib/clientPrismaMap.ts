import type { PersonType } from "@prisma/client";
import { parseOptionalDate } from "@/lib/dates";

type ClientSchemaFields = {
  documentId?: string;
  fullName?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  personType?: PersonType | null;
  rg?: string;
  maritalStatus?: string;
  profession?: string;
  zipCode?: string;
  nationality?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  streetNumber?: string;
  addressComplement?: string;
  birthDate?: string | null;
};

export function clientSchemaToPrismaData(d: ClientSchemaFields): Record<string, unknown> {
  const out: Record<string, unknown> = {
    documentId: d.documentId,
    fullName: d.fullName,
    document: d.document,
    email: d.email,
    phone: d.phone,
    address: d.address,
    personType: d.personType,
    rg: d.rg,
    maritalStatus: d.maritalStatus,
    profession: d.profession,
    zipCode: d.zipCode,
    nationality: d.nationality,
    neighborhood: d.neighborhood,
    street: d.street,
    city: d.city,
    streetNumber: d.streetNumber,
    addressComplement: d.addressComplement,
  };
  if (d.birthDate !== undefined) {
    out.birthDate = parseOptionalDate(d.birthDate ?? undefined);
  }
  return out;
}
