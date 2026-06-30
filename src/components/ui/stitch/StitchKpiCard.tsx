import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/utils";

export type KpiTone = "primary" | "accent" | "success" | "warning" | "neutral";

interface StitchKpiCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
  solid?: boolean;
}

const SOLID_BG: Record<KpiTone, string> = {
  primary: "bg-primary",
  accent: "bg-[#046ceb]",
  success: "bg-[#16a34a]",
  warning: "bg-[#d97706]",
  neutral: "bg-[#334155]",
};

const ICON_TINT: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-[#046ceb]/10 text-[#046ceb]",
  success: "bg-[#16a34a]/10 text-[#16a34a]",
  warning: "bg-[#d97706]/10 text-[#d97706]",
  neutral: "bg-muted text-muted-foreground",
};

/** Card KPI compacto. `solid` usa fundo de cor sólida da paleta. Ref. Stitch 03. */
export function StitchKpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
  solid = false,
}: StitchKpiCardProps) {
  if (solid) {
    return (
      <div
        className={cn(
          "p-4 md:p-5 rounded-xl shadow-sm flex flex-col gap-1 min-h-[7rem] text-white",
          SOLID_BG[tone],
        )}
      >
        <div className="flex justify-between items-start gap-2">
          <span className="text-xs font-medium text-white/80">{label}</span>
          {Icon ? <Icon className="w-5 h-5 text-white/70 shrink-0" aria-hidden /> : null}
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {sublabel ? <span className="text-xs text-white/75">{sublabel}</span> : null}
      </div>
    );
  }

  return (
    <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm flex flex-col gap-1 min-h-[7rem]">
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon ? (
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", ICON_TINT[tone])}>
            <Icon className="w-4 h-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {sublabel ? <span className="text-xs text-muted-foreground">{sublabel}</span> : null}
    </div>
  );
}
