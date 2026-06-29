import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function countActiveAdmins(excludeUserId?: number): Promise<number> {
  return prisma.user.count({
    where: {
      role: "admin",
      isActive: true,
      ...(excludeUserId != null ? { id: { not: excludeUserId } } : {}),
    },
  });
}

export type UserPatchInput = {
  name?: string | null;
  role?: Role;
  isActive?: boolean;
};

export type UserPatchValidation =
  | { ok: true }
  | { ok: false; message: string };

export async function validateUserPatch(
  targetUserId: number,
  actorUserId: number,
  patch: UserPatchInput,
): Promise<UserPatchValidation> {
  if (targetUserId === actorUserId) {
    if (patch.isActive === false) {
      return { ok: false, message: "Não é possível desactivar a sua própria conta." };
    }
    if (patch.role != null && patch.role !== "admin") {
      return { ok: false, message: "Não é possível alterar o seu próprio papel." };
    }
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, isActive: true },
  });
  if (!target) {
    return { ok: false, message: "Utilizador não encontrado." };
  }

  const demotingAdmin =
    target.role === "admin" &&
    ((patch.role != null && patch.role !== "admin") || patch.isActive === false);

  if (demotingAdmin) {
    const otherAdmins = await countActiveAdmins(targetUserId);
    if (otherAdmins === 0) {
      return { ok: false, message: "Deve existir pelo menos um administrador activo." };
    }
  }

  return { ok: true };
}
