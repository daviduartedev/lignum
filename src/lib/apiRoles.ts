import type { Role } from "@prisma/client";

/** Staff com acesso de escrita às APIs operacionais (read_only fica de fora). */
export const staffRoles: Role[] = ["admin", "authenticated", "sales", "finance"];
