import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type ListingStatCellProps = {
  label: string;
  value: ReactNode;
  /** Oculta o label interno quando o `<th>` já identifica a coluna. */
  hideLabel?: boolean;
  className?: string;
  valueClassName?: string;
};

/** Cabeçalho de coluna estatística - alinhar com células `ListingStatCell`. */
export const listingThStat =
  "pb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground text-center align-bottom whitespace-nowrap";

/** Célula estatística - conteúdo centrado sob o cabeçalho. */
export const listingTdStat = "py-3 px-2 align-middle text-center";

/** Coluna de texto livre (nome, veículo, descrição). */
export const listingThText =
  "pb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-left align-bottom";

export const listingTdText = "py-3 px-3 align-middle text-left";

export const listingThActions =
  "pb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right align-bottom min-w-[8.5rem]";

export const listingTdActions = "py-3 px-3 align-middle text-right whitespace-nowrap";

/** Label acima, valor centralizado abaixo - padrão de listagens (referência: `/estoque`). */
export function ListingStatCell({ label, value, hideLabel, className, valueClassName }: ListingStatCellProps) {
  return (
    <div className={cn("mx-auto flex w-full flex-col items-center text-center min-w-0", className)}>
      {!hideLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-none">{label}</span>
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
