import { Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

type LoadingSpinnerProps = {
  className?: string;
  label?: string;
};

/** Spinner padrão Lignum — Azul Royal (`text-primary`). */
export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    />
  );
}
