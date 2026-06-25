import { parsePositiveInt } from "@/lib/parseId";
import type { RouteContext } from "@/lib/withRole";

/** Extrai segmento dinâmico `id` (string) a partir de `ctx.params` do App Router. */
export async function segmentId(
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<string | undefined> {
  const p = await params;
  const raw = p.id;
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw[0]) {
    return raw[0];
  }
  return undefined;
}

/** `id` da rota → inteiro positivo ou `null`. */
export async function parseNumericId(ctx: RouteContext): Promise<number | null> {
  const idStr = await segmentId(ctx.params);
  return parsePositiveInt(idStr);
}
