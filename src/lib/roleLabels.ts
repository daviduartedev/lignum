import type { Role } from "@prisma/client";

const LABELS: Record<Role, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
  producao: "Produção",
  read_only: "Somente leitura",
};

export function roleLabel(role: Role): string {
  return LABELS[role] ?? role;
}

export const ASSIGNABLE_ROLES: Role[] = ["admin", "vendedor", "financeiro", "producao", "read_only"];
