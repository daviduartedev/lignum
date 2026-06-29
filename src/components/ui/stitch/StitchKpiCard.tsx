import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface StitchKpiCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: LucideIcon;
}

/** Card KPI compacto — referência `design/stitch/03-clientes`. */
export function StitchKpiCard({ label, value, sublabel, icon: Icon }: StitchKpiCardProps) {
  return (
    <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 min-h-[7rem]">
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon ? <Icon className="w-5 h-5 text-primary opacity-20 shrink-0" aria-hidden /> : null}
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {sublabel ? <span className="text-xs text-muted-foreground">{sublabel}</span> : null}
    </div>
  );
}
