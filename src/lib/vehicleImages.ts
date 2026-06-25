import catalog from "@/data/vehicle-model-images.json";

export type CatalogImage = {
  url: string;
  source: string;
  licenseNote: string;
};

export type CatalogEntry = {
  key: string;
  brand: string;
  model: string;
  images: CatalogImage[];
};

export function normalizeModelKey(brand: string, model: string): string {
  return `${brand.trim().toLowerCase()}/${model.trim().toLowerCase()}`;
}

const entries = (catalog as { entries: CatalogEntry[] }).entries;

/** Fotos curadas por marca+modelo (Stage 1 — D4). */
export function lookupCatalogImages(brand: string, model: string): CatalogImage[] {
  const key = normalizeModelKey(brand, model);
  const entry = entries.find((e) => e.key === key);
  return entry?.images ?? [];
}

export function hasCatalogImages(brand: string, model: string): boolean {
  return lookupCatalogImages(brand, model).length > 0;
}

/** Junta main + galeria sem duplicados (ordem preservada). */
export function mergeVehiclePhotoUrls(main?: string | null, gallery: string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw?: string | null) => {
    const u = raw?.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  add(main);
  for (const u of gallery) add(u);
  return out;
}
