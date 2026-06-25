"use client";

import Link from "next/link";

type Props = {
  /** Caminho mostrado (ex.: `/estoque`). */
  title: string;
};

export function FeatureComingSoon({ title }: Props) {
  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Em migração</h1>
        <p className="text-sm text-muted-foreground">
          A rota <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{title}</code> ainda não foi
          portada para esta versão Next.js.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Use o projeto Vite em <code className="text-xs">frontend/</code> se precisar desta área já, ou volte ao
        painel.
      </p>
      <Link href="/" className="inline-flex text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
        ← Voltar ao painel
      </Link>
    </div>
  );
}
