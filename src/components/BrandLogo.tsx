import { LignumMark } from "@/components/LignumMark";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import { cn } from "@/components/ui/utils";

type BrandLogoProps = {
  className?: string;
  /** `dark`/`light` = texto branco (fundos escuros); `onLight` = texto escuro (fundos claros). */
  variant?: "dark" | "light" | "onLight";
  /** Tamanho do símbolo (classe de altura/largura). Default para sidebar. */
  markClassName?: string;
  /** Tamanho do wordmark "LIGNUM". Default para sidebar. */
  wordClassName?: string;
};

export function BrandLogo({
  className,
  variant = "light",
  markClassName = "h-8 w-8",
  wordClassName = "text-lg",
}: BrandLogoProps) {
  const onLight = variant === "onLight";
  return (
    <span className={cn("flex items-center gap-2.5", className)} aria-label={BRAND_NAME}>
      <LignumMark className={cn("shrink-0", markClassName)} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold tracking-tight",
            wordClassName,
            onLight ? "text-foreground" : "text-white",
          )}
        >
          {BRAND_SHORT}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[9px] font-medium tracking-[0.28em]",
            onLight ? "text-muted-foreground" : "text-white/70",
          )}
        >
          GESTÃO
        </span>
      </span>
    </span>
  );
}
