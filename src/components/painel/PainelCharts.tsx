import { PRODUCTION_BAR_HEIGHTS } from "@/components/painel/painelMockData";
import { cn } from "@/components/ui/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"] as const;

export function PainelRevenueChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Faturamento x Lucro (6 meses)</h3>
        <select
          className="rounded-lg border-0 bg-muted px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20"
          defaultValue="semestre"
          aria-label="Período do gráfico"
        >
          <option value="semestre">Semestre Atual</option>
          <option value="2023">Ano 2023</option>
        </select>
      </div>

      <div className="relative h-[300px] w-full">
        <svg className="h-full w-full" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden>
          <line stroke="#f0f3ff" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
          <line stroke="#f0f3ff" strokeWidth="1" x1="0" x2="800" y1="125" y2="125" />
          <line stroke="#f0f3ff" strokeWidth="1" x1="0" x2="800" y1="200" y2="200" />
          <line stroke="#f0f3ff" strokeWidth="1" x1="0" x2="800" y1="275" y2="275" />
          <path
            d="M 50 250 L 180 180 L 310 220 L 440 100 L 570 140 L 750 60"
            fill="none"
            stroke="#0234C9"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M 50 280 L 180 240 L 310 260 L 440 200 L 570 220 L 750 180"
            fill="none"
            stroke="#aec6ff"
            strokeDasharray="5,5"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="750" cy="60" fill="#0234C9" r="5" />
          <circle cx="750" cy="180" fill="#aec6ff" r="5" />
        </svg>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-6 border-t border-border pt-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" aria-hidden />
          <span className="text-xs font-medium">Faturamento Bruto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#aec6ff]" aria-hidden />
          <span className="text-xs font-medium">Lucro Líquido</span>
        </div>
      </div>
    </div>
  );
}

export function PainelProductionChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Produção por Mês (Unidades)</h3>
      </div>
      <div className="flex h-[200px] items-end justify-between gap-4 px-4">
        {PRODUCTION_BAR_HEIGHTS.map((height, i) => (
          <div key={MONTHS[i]} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "w-full rounded-t-lg transition-colors hover:bg-secondary",
                height === 90 ? "bg-secondary" : "bg-muted",
              )}
              style={{ height: `${height}%` }}
            />
            <span className="text-xs text-muted-foreground">{MONTHS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
