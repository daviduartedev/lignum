import { prisma } from "@/lib/db";
import { logSecurityWarn } from "@/lib/secureLogger";

export function isSessionRevocationSchemaMissing(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown; meta?: unknown } | null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const meta = JSON.stringify(candidate?.meta ?? {});
  const message = error instanceof Error ? error.message : String(candidate?.message ?? error ?? "");
  const text = `${message} ${meta}`.toLowerCase();

  return (
    code === "P2022" ||
    ((text.includes("session_revoked_at") || text.includes("sessionrevokedat")) &&
      (text.includes("column") || text.includes("does not exist") || text.includes("unknown field")))
  );
}

export function isUserActiveSchemaMissing(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown; meta?: unknown } | null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const meta = JSON.stringify(candidate?.meta ?? {});
  const message = error instanceof Error ? error.message : String(candidate?.message ?? error ?? "");
  const text = `${message} ${meta}`.toLowerCase();

  return (
    code === "P2022" ||
    ((text.includes("is_active") || text.includes("isactive")) &&
      (text.includes("column") || text.includes("does not exist") || text.includes("unknown field")))
  );
}

export async function isUserActive(userId: string | number): Promise<boolean> {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return false;
  const user = await prisma.user
    .findUnique({
      where: { id },
      select: { isActive: true },
    })
    .catch((error) => {
      if (isUserActiveSchemaMissing(error)) {
        logSecurityWarn("user_active.schema_missing", { action: "check", userId: id });
        return { isActive: true };
      }
      throw error;
    });
  return user?.isActive !== false;
}

export async function revokeUserSessions(userId: string | number): Promise<void> {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await prisma.user.update({
      where: { id },
      data: { sessionRevokedAt: new Date() },
    });
  } catch (error) {
    if (isSessionRevocationSchemaMissing(error)) {
      logSecurityWarn("session_revocation.schema_missing", { action: "revoke", userId: id });
      return;
    }
    throw error;
  }
}

export async function isSessionRevoked(userId: string | number, sessionIssuedAt?: number): Promise<boolean> {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) return true;
  const user = await prisma.user
    .findUnique({
      where: { id },
      select: { sessionRevokedAt: true },
    })
    .catch((error) => {
      if (isSessionRevocationSchemaMissing(error)) {
        logSecurityWarn("session_revocation.schema_missing", { action: "check", userId: id });
        return { sessionRevokedAt: null };
      }
      throw error;
    });
  if (!user) return true;
  if (!user.sessionRevokedAt) return false;
  if (!sessionIssuedAt || !Number.isFinite(sessionIssuedAt)) return true;
  return user.sessionRevokedAt.getTime() >= sessionIssuedAt;
}
