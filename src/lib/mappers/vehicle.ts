import type { StrapiMedia, Vehicle } from "@/types";

function urlToStrapiMedia(url: string, i: number): StrapiMedia {
  const name = url.split("/").pop() || `arquivo-${i}`;
  return {
    id: i + 1,
    url,
    name,
    mime: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image/jpeg" : "application/octet-stream",
    size: 0,
  };
}

/** Converte linha JSON de `GET /api/vehicles` para o tipo `Vehicle` (formato Strapi). */
export function mapApiRowToVehicle(row: Record<string, unknown>): Vehicle {
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
      plate: String(row.plate ?? ""),
      brand: String(row.brand ?? ""),
      model: String(row.model ?? ""),
      version: row.version != null ? String(row.version) : undefined,
      year_manufacture: Number(row.yearManufacture ?? 0),
      year_model: Number(row.yearModel ?? 0),
      mileage: Number(row.mileage ?? 0),
      color: row.color != null ? String(row.color) : undefined,
      fuel: row.fuel as Vehicle["attributes"]["fuel"],
      transmission: row.transmission as Vehicle["attributes"]["transmission"],
      fipe_price: row.fipePrice != null ? Number(row.fipePrice) : undefined,
      purchase_price: Number(row.purchasePrice ?? 0),
      estimated_maintenance_cost:
        row.estimatedMaintenanceCost != null ? Number(row.estimatedMaintenanceCost) : undefined,
      selling_price: row.sellingPrice != null ? Number(row.sellingPrice) : undefined,
      minimum_selling_price:
        row.minimumSellingPrice != null ? Number(row.minimumSellingPrice) : undefined,
      status: (row.status as Vehicle["attributes"]["status"]) ?? "disponivel",
      observations: row.observations != null ? String(row.observations) : undefined,
      doors_count: row.doorsCount != null ? Number(row.doorsCount) : undefined,
      last_licensing_date: row.lastLicensingDate != null ? String(row.lastLicensingDate) : undefined,
      purchase_entry_at: row.purchaseEntryAt != null ? String(row.purchaseEntryAt) : undefined,
      purchase_entry_mileage: row.purchaseEntryMileage != null ? Number(row.purchaseEntryMileage) : undefined,
      purchase_supplier_id: row.purchaseSupplierId != null ? Number(row.purchaseSupplierId) : undefined,
      purchase_payment_json:
        row.purchasePaymentJson != null && typeof row.purchasePaymentJson === "object"
          ? (row.purchasePaymentJson as Record<string, unknown>)
          : row.purchasePaymentJson != null
            ? (row.purchasePaymentJson as unknown)
            : undefined,
      renavam: row.renavam != null ? String(row.renavam) : undefined,
      chassis: row.chassis != null ? String(row.chassis) : undefined,
      legal_situation: row.legalSituation as Vehicle["attributes"]["legal_situation"],
      category_kind: row.categoryKind as Vehicle["attributes"]["category_kind"],
      cautelar: row.cautelar as Vehicle["attributes"]["cautelar"],
      species_category: row.speciesCategory != null ? String(row.speciesCategory) : undefined,
      registration_city: row.registrationCity != null ? String(row.registrationCity) : undefined,
      registration_uf: row.registrationUf != null ? String(row.registrationUf) : undefined,
      listing_title: row.listingTitle != null ? String(row.listingTitle) : undefined,
      official_extra_fields:
        row.officialExtraFields != null && typeof row.officialExtraFields === "object"
          ? (row.officialExtraFields as Record<string, string>)
          : undefined,
      senatran_field_provenance:
        row.senatranFieldProvenance != null && typeof row.senatranFieldProvenance === "object"
          ? (row.senatranFieldProvenance as Record<string, "senatran" | "manual">)
          : undefined,
      main_photo: row.mainPhotoUrl
        ? ({ url: String(row.mainPhotoUrl) } as unknown as Vehicle["attributes"]["main_photo"])
        : undefined,
      gallery:
        Array.isArray(row.galleryUrls) && (row.galleryUrls as string[]).length > 0
          ? {
              data: (row.galleryUrls as string[]).map((u, i) => urlToStrapiMedia(u, i)),
            }
          : undefined,
      attachments:
        Array.isArray(row.attachmentUrls) && (row.attachmentUrls as string[]).length > 0
          ? {
              data: (row.attachmentUrls as string[]).map((u, i) => urlToStrapiMedia(u, i)),
            }
          : undefined,
      buyer: undefined,
      sale: undefined,
      createdAt,
      updatedAt,
    },
  };
}
