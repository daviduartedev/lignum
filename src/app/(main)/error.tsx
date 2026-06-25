"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-lg font-semibold">Não foi possível carregar esta área</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Ocorreu um erro ao renderizar o conteúdo. Tente novamente.
      </p>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
