import { prisma } from "@/lib/db";
import { parsePositiveInt } from "@/lib/parseId";

export async function resolveEmployeeInternalId(idStr: string): Promise<number | null> {
  const num = parsePositiveInt(idStr);
  if (num == null) return null;
  const row = await prisma.employee.findUnique({ where: { id: num }, select: { id: true } });
  return row?.id ?? null;
}

export async function validateActiveEmployeeIds(ids: number[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const unique = [...new Set(ids)];
  const found = await prisma.employee.count({
    where: { id: { in: unique }, isActive: true },
  });
  return found === unique.length;
}
