/** Resolve id de rota a partir de entidade Prisma (legado Strapi: documentId ou id numérico). */
export function strapiEntityId(entity: { id: number; documentId?: string | null }): string {
  return entity.documentId ?? String(entity.id);
}

export function vehicleSelectLabel(v: {
  brand?: string;
  model?: string;
  plate?: string;
  version?: string | null;
  attributes?: {
    brand?: string;
    model?: string;
    plate?: string;
    version?: string | null;
  };
}): string {
  const brand = v.brand ?? v.attributes?.brand ?? "";
  const model = v.model ?? v.attributes?.model ?? "";
  const plate = v.plate ?? v.attributes?.plate ?? "";
  const version = v.version ?? v.attributes?.version;
  const base = `${brand} ${model}`.trim();
  const ver = version ? ` ${version}` : "";
  return `${base}${ver} · ${plate}`;
}
