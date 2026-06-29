import type { ReactNode } from "react";

interface StitchPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Cabeçalho de página alinhado ao layout Stitch (03–05). */
export function StitchPageHeader({ title, description, actions }: StitchPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
    </div>
  );
}
