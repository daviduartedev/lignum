import { mockLookup } from "@/lib/senatran/mockProvider";
import { httpLookup } from "@/lib/senatran/httpProvider";
import type { SenatranLookupInput, SenatranNormalizedVehicle } from "@/lib/senatran/types";

export type SenatranProviderName = "mock" | "http";

export function getSenatranProvider(): SenatranProviderName {
  const p = (process.env.SENATRAN_PROVIDER ?? "mock").toLowerCase();
  if (p === "http") return "http";
  return "mock";
}

export async function runSenatranLookup(input: SenatranLookupInput): Promise<{
  normalized: SenatranNormalizedVehicle;
  rawForAudit: Record<string, unknown>;
  provider: SenatranProviderName;
  unitCost: number;
}> {
  const provider = getSenatranProvider();
  const unitCost = provider === "mock" ? 0 : Number(process.env.SENATRAN_UNIT_COST_BRL ?? "0") || 0;

  if (provider === "http") {
    const r = await httpLookup(input);
    return { ...r, provider, unitCost };
  }

  const r = await mockLookup(input);
  return { ...r, provider, unitCost };
}
