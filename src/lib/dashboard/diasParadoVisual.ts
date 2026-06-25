/** Classes de badge para dias parado (painel e listas de giro). */
export function diasParadoBadgeClass(dias: number): string {
  if (dias > 60) return "bg-red-50 text-red-700";
  if (dias >= 45) return "bg-amber-50 text-amber-800";
  return "bg-emerald-50 text-emerald-700";
}
