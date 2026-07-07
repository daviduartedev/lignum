import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ClipboardList,
  Factory,
  TrendingUp,
  Wallet,
  Banknote,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/components/ui/utils";

const ICONS: Record<string, LucideIcon> = {
  payments: Banknote,
  wallet: Wallet,
  factory: Factory,
  clipboard: ClipboardList,
};

type PainelKpiCardProps = {
  label: string;
  value: string;
  trend: string;
  trendLabel?: string;
  trendTone: "success" | "info" | "danger";
  icon: keyof typeof ICONS;
};

export function PainelKpiCard({ label, value, trend, trendLabel, trendTone, icon }: PainelKpiCardProps) {
  const Icon = ICONS[icon] ?? Banknote;
  const TrendIcon = trendTone === "info" ? RefreshCw : trendTone === "danger" ? AlertTriangle : TrendingUp;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="mt-4">
        <span className="text-[28px] font-bold tabular-nums text-foreground">{value}</span>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-sm font-medium",
            trendTone === "success" && "text-[#16a34a]",
            trendTone === "info" && "text-secondary-foreground",
            trendTone === "danger" && "text-[#b91c1c]",
          )}
        >
          <TrendIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{trend}</span>
          {trendLabel ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">{trendLabel}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
