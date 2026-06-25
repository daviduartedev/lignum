"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold text-zinc-900">Algo correu mal</h1>
      <p className="max-w-md text-center text-sm text-zinc-600">
        Ocorreu um erro inesperado. Pode tentar novamente ou voltar ao início.
      </p>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button type="button" onClick={() => (window.location.href = "/")}>
          Ir para o início
        </Button>
      </div>
    </div>
  );
}
