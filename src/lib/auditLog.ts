import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { redactSensitive } from "@/lib/secureLogger";

export type WriteAuditLogInput = {
  action: AuditAction;
  userId?: number | null;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const metadata = redactSensitive(input.metadata ?? {}) as Prisma.InputJsonValue;
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        metadata,
      },
    });
  } catch {
    // Auditoria não deve falhar a operação principal.
  }
}
