import { prisma } from "@/lib/db";
import { parsePositiveInt } from "@/lib/parseId";

/** Resolve `id` da rota (inteiro positivo) para o ID interno Prisma. */
export async function resolveVehicleInternalId(idStr: string): Promise<number | null> {
  const num = parsePositiveInt(idStr);
  if (num == null) return null;
  const row = await prisma.vehicle.findUnique({ where: { id: num }, select: { id: true } });
  return row?.id ?? null;
}
