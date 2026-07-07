import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type ListingStatCellProps = {
  label: string;
  value: ReactNode;
  hideLabel?: boolean;
  className?: string;
  valueClassName?: string;
};

// ─── Constantes de célula ────────────────────────────────────────────────────
// Padrão: py-3.5 garante linhas confortáveis; px-4 no meio, px-6 nas bordas via first/last.

export const listingThStat =
  "py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground text-center align-bottom whitespace-nowrap first:pl-6 last:pr-6";

export const listingTdStat =
  "py-3.5 px-4 align-middle text-center text-sm first:pl-6 last:pr-6";

export const listingThText =
  "py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground text-left align-bottom first:pl-6 last:pr-6";

export const listingTdText =
  "py-3.5 px-4 align-middle text-left text-sm first:pl-6 last:pr-6";

export const listingThActions =
  "py-3 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right align-bottom whitespace-nowrap last:pr-6";

export const listingTdActions =
  "py-3.5 px-4 align-middle text-right whitespace-nowrap last:pr-6";

// ─── Componente composto ──────────────────────────────────────────────────────

export function ListingStatCell({
  label,
  value,
  hideLabel,
  className,
  valueClassName,
}: ListingStatCellProps) {
  return (
    <div className={cn("mx-auto flex w-full flex-col items-center text-center min-w-0", className)}>
      {!hideLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "flex w-full items-center justify-center text-sm font-semibold text-foreground tabular-nums [&>*]:mx-auto",
          !hideLabel && "mt-1",
          valueClassName,
        )}
      >
        {value}
      </div>
    </div>
  );
}
