"use client";

import Link from "next/link";
import { Box, Maximize2, Rotate3d, ZoomIn, RefreshCw, Sparkles } from "lucide-react";

const MEASURES = [
  { label: "Comprimento", value: "8,50 m" },
  { label: "Largura", value: "2,60 m" },
  { label: "Altura das tampas", value: "0,80 m" },
];

const OPTIONS = [
  { label: "Estilo de tampa", value: "Tampa plana" },
  { label: "Assoalho", value: "Madeira (eucalipto)" },
  { label: "Acabamento", value: "Verniz natural" },
];

export function Configurador3DPlaceholder() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">Configurador 3D</h1>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
              Em breve
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte a carroceria visualmente e gere o orçamento a partir do modelo escolhido.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-[#eef3fb] to-[#dde6f5] shadow-[var(--shadow-card)]">
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Box className="h-10 w-10" />
              </span>
              <p className="text-sm font-medium text-foreground">Pré-visualização 3D da carroceria</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                O modelo tridimensional interativo será renderizado aqui, refletindo as medidas e opções
                escolhidas ao lado.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-sm">
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Rotate3d className="h-4 w-4" /> Girar</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><ZoomIn className="h-4 w-4" /> Zoom</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4" /> Resetar</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Maximize2 className="h-4 w-4" /> Tela cheia</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Medidas</h3>
            <div className="space-y-3">
              {MEASURES.map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium text-foreground">{m.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-primary/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Opções</h3>
            <div className="space-y-2">
              {OPTIONS.map((o) => (
                <div key={o.label} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{o.label}</span>
                  <span className="font-medium text-foreground">{o.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-secondary p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Orçamento estimado
            </div>
            <div className="mt-1 text-2xl font-bold text-primary">R$ 42.850,00</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Valor ilustrativo. Na versão final, o preço virá do mesmo motor de cálculo dos orçamentos.
            </p>
            <Link
              href="/orcamentos/novo"
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent"
            >
              Criar orçamento por formulário
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Em desenvolvimento.</span> Esta é uma prévia da
        experiência do configurador 3D. O motor de orçamento paramétrico que o alimenta já está pronto — a
        camada de visualização tridimensional entra na etapa final do projeto.
      </div>
    </div>
  );
}
