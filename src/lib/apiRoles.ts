import type { Role } from "@prisma/client";

/** Qualquer staff autenticado com acesso de leitura operacional. */
export const allStaffReadRoles: Role[] = ["admin", "vendedor", "financeiro", "producao", "read_only"];

/** Mutações comerciais (clientes, vendas, contratos, veículos legado, etc.). */
export const commercialWriteRoles: Role[] = ["admin", "vendedor"];

/** Mutações financeiras. */
export const financeWriteRoles: Role[] = ["admin", "financeiro"];

/** Mutações de produção / OS. */
export const productionWriteRoles: Role[] = ["admin", "producao"];

/** Preferências pessoais e notificações (exceto read_only). */
export const staffPreferencesWriteRoles: Role[] = ["admin", "vendedor", "financeiro", "producao"];

/** Apenas administrador. */
export const adminOnlyRoles: Role[] = ["admin"];

/** @deprecated Use grupos específicos (`commercialWriteRoles`, etc.). */
export const staffRoles: Role[] = commercialWriteRoles;
