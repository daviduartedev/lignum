/** Resolve id de rota a partir de entidade Prisma (legado Strapi: documentId ou id numérico). */
export function strapiEntityId(entity: { id: number; documentId?: string | null }): string {
  return entity.documentId ?? String(entity.id);
}
