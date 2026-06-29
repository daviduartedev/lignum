import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

interface StitchTableShellProps {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Container branco com borda para tabelas — referência Stitch 03. */
export function StitchTableShell({ children, toolbar, footer, className }: StitchTableShellProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm overflow-hidden min-w-0", className)}>
      {toolbar ? <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">{toolbar}</div> : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="px-4 py-3 bg-muted/30 border-t border-border">{footer}</div> : null}
    </div>
  );
}
