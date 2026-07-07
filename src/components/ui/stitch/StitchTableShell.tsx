import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

interface StitchTableShellProps {
  children: ReactNode;
  /** Toolbar exibida acima da tabela (busca, filtros). Sem padding extra — use junto com StitchSectionCard headerEnd para evitar duplicação. */
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Container com overflow-x para tabelas.
 * Não adiciona borda/sombra própria — use dentro de StitchSectionCard com noPadding.
 * Para uso standalone (sem section card), use `standalone` prop.
 */
export function StitchTableShell({ children, toolbar, footer, className }: StitchTableShellProps) {
  return (
    <div className={cn("min-w-0", className)}>
      {toolbar ? (
        <div className="px-6 py-3 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="px-6 py-3 border-t border-border bg-muted/20">{footer}</div> : null}
    </div>
  );
}
