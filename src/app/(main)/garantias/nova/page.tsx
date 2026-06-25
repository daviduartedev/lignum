import { Suspense } from "react";
import { GarantiaForm } from "@/components/backoffice/GarantiaForm";

export default function NovaGarantiaPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Carregando…</div>}>
      <GarantiaForm />
    </Suspense>
  );
}
