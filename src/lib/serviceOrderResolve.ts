import { prisma } from "@/lib/db";
import { parsePositiveInt } from "@/lib/parseId";

export async function resolveServiceOrderInternalId(idStr: string): Promise<number | null> {
  const num = parsePositiveInt(idStr);
  if (num == null) return null;
  const row = await prisma.serviceOrder.findUnique({ where: { id: num }, select: { id: true } });
  return row?.id ?? null;
}
