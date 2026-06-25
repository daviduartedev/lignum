import type { FuelType } from "@prisma/client";

/** Mapeia texto do provedor (PT-BR) para enum do domínio; `undefined` se não reconhecido. */
export function mapFuelLabelToFuelType(label: string | undefined | null): FuelType | undefined {
  if (label == null || !label.trim()) return undefined;
  const t = label.trim().toLowerCase();

  if (t.includes("flex")) return "flex";
  if (t.includes("álcool") || t.includes("alcool") || t === "á" || t === "a") return "flex";
  if (t.includes("gasolina") || t === "g") return "gasolina";
  if (t.includes("diesel")) return "diesel";
  if (t.includes("elétr") || t.includes("eletr")) return "eletrico";
  if (t.includes("híbr") || t.includes("hibr")) return "hibrido";

  return undefined;
}
