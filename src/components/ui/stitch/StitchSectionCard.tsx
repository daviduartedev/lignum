import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

interface StitchSectionCardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Card com cabeçalho de secção — referência Stitch 04/05. */
export function StitchSectionCard({ title, children, footer, className }: StitchSectionCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm overflow-hidden", className)}>
      {title ? (
        <div className="px-6 py-4 border-b border-border bg-muted/40">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      ) : null}
      <div className="p-6">{children}</div>
      {footer ? <div className="px-6 py-4 bg-muted/40 border-t border-border flex justify-end gap-3">{footer}</div> : null}
    </div>
  );
}
