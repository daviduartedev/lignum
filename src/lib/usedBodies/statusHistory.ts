import type { Prisma, UsedBodyStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type StatusChangeInput = {
  usedBodyId: number;
  fromStatus: UsedBodyStatus | null;
  toStatus: UsedBodyStatus;
  changedByUserId?: number;
  notes?: string;
};

export async function recordUsedBodyStatusChange(input: StatusChangeInput) {
  return prisma.usedBodyStatusHistory.create({
    data: {
      usedBodyId: input.usedBodyId,
      fromStatus: input.fromStatus ?? undefined,
      toStatus: input.toStatus,
      changedByUserId: input.changedByUserId,
      notes: input.notes,
    },
  });
}

export async function updateUsedBodyWithStatusHistory(
  usedBodyId: number,
  data: Prisma.UsedBodyUpdateInput,
  opts: {
    previousStatus: UsedBodyStatus;
    nextStatus?: UsedBodyStatus;
    changedByUserId?: number;
    notes?: string;
  },
) {
  const nextStatus = opts.nextStatus ?? (typeof data.status === "string" ? data.status : opts.previousStatus);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.usedBody.update({
      where: { id: usedBodyId },
      data,
      include: { supplier: { select: { id: true, companyName: true } } },
    });

    if (nextStatus !== opts.previousStatus) {
      await tx.usedBodyStatusHistory.create({
        data: {
          usedBodyId,
          fromStatus: opts.previousStatus,
          toStatus: nextStatus,
          changedByUserId: opts.changedByUserId,
          notes: opts.notes,
        },
      });
    }

    return updated;
  });
}

export async function createUsedBodyWithInitialHistory(
  data: Prisma.UsedBodyCreateInput,
  changedByUserId?: number,
) {
  const status = (data.status as UsedBodyStatus | undefined) ?? "disponivel";

  return prisma.$transaction(async (tx) => {
    const created = await tx.usedBody.create({
      data: { ...data, status },
      include: { supplier: { select: { id: true, companyName: true } } },
    });

    await tx.usedBodyStatusHistory.create({
      data: {
        usedBodyId: created.id,
        fromStatus: null,
        toStatus: status,
        changedByUserId,
        notes: "Cadastro inicial",
      },
    });

    return created;
  });
}
