import { Suspense } from "react";
import { Estoque } from "@/components/pages/Estoque";

export default function EstoquePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Carregando estoque…</div>}>
      <Estoque />
    </Suspense>
  );
}
