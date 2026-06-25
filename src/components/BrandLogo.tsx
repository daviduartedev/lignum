"use client";

import Image from "next/image";
import {
  BRAND_LOGO_SRC,
  BRAND_LOGO_USE_IMAGE,
  BRAND_NAME,
  BRAND_SHORT,
  BRAND_TAGLINE,
} from "@/lib/brand";
import { cn } from "@/components/ui/utils";

type BrandLogoProps = {
  /**
   * Caixa da logo (lockup: marca + tagline). Use classes de tamanho explícitas.
   * Ex.: sidebar `h-11 w-36`, login `h-40 w-56 max-w-[90vw]`.
   */
  className?: string;
  /** LCP: usar em páginas públicas onde a logo está acima da dobra. */
  priority?: boolean;
  /** `dark` para fundos escuros (login); `light` para sidebar escura com texto branco. */
  variant?: "dark" | "light";
};

const defaultClassName = "relative h-11 w-36 shrink-0";

function TextLockup({
  className,
  variant,
}: {
  className?: string;
  variant: "dark" | "light";
}) {
  const isDarkBg = variant === "dark";
  return (
    <span
      className={cn(
        "flex flex-col items-center justify-center text-center leading-tight",
        className,
      )}
      aria-label={BRAND_NAME}
    >
      <span
        className={cn(
          "text-xl font-bold tracking-tight sm:text-2xl",
          isDarkBg ? "text-white" : "text-sidebar-foreground",
        )}
      >
        {BRAND_SHORT}
      </span>
      <span
        className={cn(
          "mt-0.5 max-w-[14rem] text-[10px] font-medium leading-snug sm:text-xs",
          isDarkBg ? "text-white/70" : "text-sidebar-foreground/70",
        )}
      >
        {BRAND_TAGLINE}
      </span>
    </span>
  );
}

export function BrandLogo({
  className = defaultClassName,
  priority = false,
  variant = "light",
}: BrandLogoProps) {
  if (!BRAND_LOGO_USE_IMAGE) {
    return <TextLockup className={className} variant={variant} />;
  }

  return (
    <span className={cn("relative block", className)}>
      <Image
        src={BRAND_LOGO_SRC}
        alt={BRAND_NAME}
        fill
        className="object-contain object-center"
        priority={priority}
        sizes="(max-width: 768px) 280px, 200px"
      />
    </span>
  );
}
