import type { Vehicle } from "@/types";
import { vehicleAttrs } from "@/types";

export type EstoqueSortKey = "none" | "valor_asc" | "valor_desc" | "ano_asc" | "ano_desc";

export function normalizePlate(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function sortVehiclesByKey(list: Vehicle[], sortKey: EstoqueSortKey): Vehicle[] {
  if (sortKey === "none") return list;

  const sorted = [...list];
  sorted.sort((a, b) => {
    const aa = vehicleAttrs(a);
    const bb = vehicleAttrs(b);
    switch (sortKey) {
      case "valor_asc":
        return (aa.purchase_price ?? 0) - (bb.purchase_price ?? 0);
      case "valor_desc":
        return (bb.purchase_price ?? 0) - (aa.purchase_price ?? 0);
      case "ano_asc":
        return (aa.year_model ?? 0) - (bb.year_model ?? 0);
      case "ano_desc":
        return (bb.year_model ?? 0) - (aa.year_model ?? 0);
      default:
        return 0;
    }
  });
  return sorted;
}

export function distinctVehicleColors(vehicles: Vehicle[]): string[] {
  const set = new Set<string>();
  for (const v of vehicles) {
    const color = vehicleAttrs(v).color?.trim();
    if (color) set.add(color);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
