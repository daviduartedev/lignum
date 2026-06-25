import { Suspense } from "react";
import { GarantiaForm } from "@/components/backoffice/GarantiaForm";

export default async function GarantiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Carregando…</div>}>
      <GarantiaForm routeId={id} />
    </Suspense>
  );
}
