import { AlertCircle } from "lucide-react";
import { PAINEL_ALERTS } from "@/components/painel/painelMockData";
import { cn } from "@/components/ui/utils";

const ALERT_STYLES = {
  danger: {
    wrap: "border-l-[#ba1a1a] bg-[#ffdad6]",
    dot: "bg-[#ba1a1a] animate-pulse",
    title: "text-[#93000a]",
    action: "text-[#ba1a1a]",
  },
  warning: {
    wrap: "border-l-orange-500 bg-orange-100",
    dot: "bg-orange-500",
    title: "text-orange-800",
    action: "text-orange-800",
  },
  info: {
    wrap: "border-l-secondary bg-secondary",
    dot: "bg-secondary",
    title: "text-secondary-foreground",
    action: "text-secondary-foreground",
  },
  neutral: {
    wrap: "border-l-border bg-muted",
    dot: "bg-muted-foreground/50",
    title: "text-muted-foreground",
    action: "text-muted-foreground",
  },
} as const;

export function PainelAlerts() {
  return (
    <div className="h-full rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-6 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-[#ba1a1a]" aria-hidden />
        <h3 className="text-lg font-semibold text-foreground">Alertas do Sistema</h3>
      </div>

      <div className="space-y-4">
        {PAINEL_ALERTS.map((alert) => {
          const s = ALERT_STYLES[alert.tone];
          return (
            <div key={alert.title} className={cn("flex gap-3 rounded-lg border-l-4 p-3", s.wrap)}>
              <div className="mt-1">
                <div className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm font-medium", s.title)}>{alert.title}</span>
                <p className="mt-1 text-xs text-muted-foreground">{alert.body}</p>
                {"action" in alert && alert.action ? (
                  <button type="button" className={cn("mt-2 text-left text-sm underline", s.action)}>
                    {alert.action}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
