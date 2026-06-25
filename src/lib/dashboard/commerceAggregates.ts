import { saleDateToSpYearMonth } from "@/lib/dashboard/spCalendar";

export function normalizeBrandKey(brand: string): string {
  return brand.trim().toLowerCase();
}

export type TopMarcaRow = { marca: string; vendasCount: number };

/** Ranking por contagem de vendas; desempate alfabético pela chave normalizada. */
export function computeTopMarcas(rows: { brand: string }[], limit = 5): TopMarcaRow[] {
  const map = new Map<string, { count: number; label: string }>();
  for (const { brand } of rows) {
    const key = normalizeBrandKey(brand);
    if (!key) continue;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { count: 1, label: brand.trim() });
  }
  return [...map.entries()]
    .map(([key, v]) => ({ key, marca: v.label, vendasCount: v.count }))
    .sort((a, b) => b.vendasCount - a.vendasCount || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map(({ marca, vendasCount }) => ({ marca, vendasCount }));
}

export type VendaMesBucket = { ano: number; mes: number; vendasCount: number };

const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

/** Conta vendas por mês civil SP, na ordem de `monthsOrdered`. */
export function bucketSalesCountsPerMonth(
  sales: { saleDate: Date }[],
  monthsOrdered: { y: number; m: number }[],
): VendaMesBucket[] {
  const counts = new Map<string, number>();
  for (const mo of monthsOrdered) {
    counts.set(monthKey(mo.y, mo.m), 0);
  }
  for (const { saleDate } of sales) {
    const { y, m } = saleDateToSpYearMonth(saleDate);
    const k = monthKey(y, m);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return monthsOrdered.map((mo) => ({
    ano: mo.y,
    mes: mo.m,
    vendasCount: counts.get(monthKey(mo.y, mo.m)) ?? 0,
  }));
}
