# Padroes de frontend e UX

Criterios para ciclos futuros que alterem UI. **Este documento nao autoriza** alterar telas existentes sem cycle dedicado.

## Design system vigente

| Recurso | Caminho |
|---------|---------|
| **Design system / tokens / UI patterns** | [`design-system.md`](design-system.md) |
| Styleguide (CSS tokens) | `src/styles/styleguide/` |
| Componentes base | `src/components/ui/*` (Radix + Tailwind) |
| Tema e tokens | `src/styles/theme.css` |
| Modais e dialogos | [`ux/modais.md`](ux/modais.md) (quando existir) |
| Toasts | `src/lib/toast.ts` + react-toastify — padroes em [`design-system.md`](design-system.md) |
| Brandbook | `brand/Movix · Brandbook.pdf` (referencia complementar) |

Novos ciclos que alterem UI compartilhada devem consultar [`design-system.md`](design-system.md) para spacing, cores semanticas e padroes de toast/badge/alert antes de introduzir valores soltos.

## Consistencia visual

- Reutilizar componentes de `src/components/ui/` antes de criar novos.
- Espacamento e hierarquia alinhados ao restante do app.
- Responsividade minima: layouts devem funcionar em mobile e desktop.
- Preservar design system existente; nao duplicar padroes de UI.

## Estados obrigatorios em fluxos novos

| Estado | Criterio |
|--------|----------|
| Loading | feedback visivel durante fetch/mutacao |
| Empty | mensagem clara quando lista/dado vazio |
| Error | mensagem user-facing em PT-BR, acao de retry quando fizer sentido |
| Disabled | controles desabilitados durante submit ou quando invalido |
| Success | toast ou feedback equivalente apos acao concluida |

Fluxo **plataforma / onboarding de lojas** (`/plataforma/**`): ver estados detalhados em [platform-onboarding](features/platform-onboarding/readme.md).

## Acessibilidade basica

- Botoes e links com texto ou `aria-label` descritivo.
- Modais/dialogos: foco trap e fechamento por Escape quando aplicavel.
- Contraste legivel; nao depender apenas de cor para informacao critica.
- Formularios: labels associados aos inputs.

## Revisao visual

Checklist generico para cycles que tocarem UI:

- [ ] Componentes existentes reutilizados.
- [ ] Estados loading/empty/error/disabled cobertos.
- [ ] Textos em PT-BR.
- [ ] Responsividade verificada.
- [ ] Acessibilidade basica conferida.

**Brandbook:** exigir conferencia apenas quando o cycle tocar visual, landing, identidade, marketing ou componentes de UI relevantes — nao em todo cycle.

## O que evitar

- CSS ad-hoc que duplica tokens do tema (ver escala em [`design-system.md`](design-system.md)).
- Hex soltos ou spacing aleatorio em `src/components/ui/` (usar tokens semanticos).
- Novos padroes de modal/toast sem alinhar ao existente.
- Alterar espacamentos ou layout de telas existentes fora do escopo do cycle.
- Overengineering de abstracoes de UI.

## Fallback de imagem de veículo

- Componente partilhado: `VehicleThumbnail` (estoque, vitrine); galeria: `DetalheVeiculoGallery`.
- Ordem: foto real (`mainPhotoUrl`) → Unsplash por título (`brand`/`model`/`version`) → ícone neutro.
- `<img>` com `alt` descritivo; `onError` recua para ícone quando URL quebrada.
- Catálogo curado em `src/data/vehicle-model-images.json` para import sugerido no form; exibição usa Unsplash API, não o catálogo directamente.

## Referencias

- UX transversal no README: [`README.md`](README.md)
- Harness e workflow: [`development-workflow.md`](development-workflow.md)
