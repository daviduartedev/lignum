"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintOrPdfToolbar() {
  return (
    <div className="print:hidden mb-8 flex flex-wrap gap-3">
      <Button type="button" onClick={() => window.print()}>
        Imprimir ou guardar como PDF
      </Button>
      <Button variant="outline" asChild>
        <Link href="/configuracoes">Voltar às configurações</Link>
      </Button>
    </div>
  );
}
