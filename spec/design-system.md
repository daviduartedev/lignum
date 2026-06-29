# Design system / UI patterns (Lignum Gestao)

Documento canónico de tokens visuais, padrões de componentes compartilhados e política de uso. Complementa [`frontend.md`](frontend.md).

**Escopo:** identidade AlaCruz/Lignum — azul royal `#0234C9`, accent `#046CEB`, sidebar `#000000`. Logo PNG opcional em `public/lignum-logo.png`; fallback textual via `BrandLogo`.

## Onde vive no código

| Recurso | Caminho |
|---------|---------|
| **Styleguide (tokens)** | `src/styles/styleguide/` — `fonts.css`, `spacings.css`, `semantic-colors.css`, `index.css` |
| Tema e bridge Tailwind | `src/styles/theme.css` (importa styleguide + `@theme inline`) |
| Toasts | `src/lib/toast.ts` + `src/styles/toastify.css` + `react-toastify` |
| Componentes base | `src/components/ui/*` |

## Tokens de spacing

Escala semântica para padding, gap e margin. Preferir estas vars antes de valores Tailwind ad hoc.

| Token CSS | Valor | Uso típico |
|-----------|-------|------------|
| `--lignum-space-xs` | `0.25rem` (4px) | Gap mínimo ícone↔texto em badge |
| `--lignum-space-sm` | `0.5rem` (8px) | Gap em botões com ícone |
| `--lignum-space-md` | `0.75rem` (12px) | Gap ícone↔texto em alert/toast |
| `--lignum-space-lg` | `1rem` (16px) | Padding vertical de toast |
| `--lignum-space-xl` | `1.5rem` (24px) | Padding de card; gap entre secções |

**Importante:** usar prefixo `lignum-space-*` — **não** `--spacing-md`, `--spacing-lg`, etc., pois colidem com a escala Tailwind (`max-w-md`, `p-lg`, …).

### Regras

- Novos componentes em `src/components/ui/` devem usar a escala acima.
- Evitar `p-2.5`, `gap-2.5`, `px-5` etc. sem justificativa documentada no cycle.
- Telas existentes com spacing solto: migrar incrementalmente em cycles futuros.

## Tokens de cor semântica

Cores de **feedback e status**. Derivadas do uso actual no app (toasts, greens/reds Tailwind). Distintas de `--primary` (marca/ação) e `--destructive` (ação destrutiva em UI).

| Token | Valor | Uso |
|-------|-------|-----|
| `--success` | `#16a34a` | Badge/alert positivo (status de domínio — ex. margem, concluído) |
| `--success-emphasis` | `#22c55e` | Realce em badges/charts |
| `--success-foreground` | `#ffffff` | Texto sobre fundo success |
| `--error` | `#b91c1c` | Toast erro, feedback de falha |
| `--error-emphasis` | `#ef4444` | Gradiente progress bar error |
| `--error-foreground` | `#ffffff` | Texto sobre fundo error |
| `--warning` | `#ca8a04` | Toast aviso, estados de atenção |
| `--warning-foreground` | `#ffffff` | Texto sobre fundo warning |
| `--info` | `#2563eb` | Toast informativo |
| `--info-foreground` | `#ffffff` | Texto sobre fundo info |
| `--neutral` | `#717182` | Texto secundário / estado neutro (= `--muted-foreground`) |
| `--primary` | (existente) | Ações principais, marca |
| `--destructive` | (existente) | Botões/links destrutivos — **não** confundir com `--error` |

### Regras

- Não introduzir hex soltos em componentes compartilhados; usar vars do tema.
- Em telas de feature, hex legado (`#22C55E`, `#111827`, …) permanece até cycle de migração; preferir tokens em código novo.
- Contraste legível obrigatório (WCAG AA como meta em feedback crítico).

## Radius e sombra (referência)

| Padrão | Valor / classe | Uso |
|--------|----------------|-----|
| Radius base | `--radius` (`0.75rem`) | Inputs, botões |
| Radius card | `rounded-2xl` | Cards |
| Radius toast | `1rem` | Toasts Movix |
| Sombra card | `shadow-sm` | Cards |
| Sombra toast | definida em `toastify.css` | Toasts |

## Toasts

API: `import { toast } from "@/lib/toast"` — `success`, `error`, `warning`, `info`, `apiError`.

**Layout e UX:** defaults do [react-toastify](https://fkhadra.github.io/react-toastify/) (padding, ícone, botão fechar, progress bar com border-radius). Não sobrescrever estrutura CSS — só tokens de cor em `src/styles/toastify.css`.

| Aspecto | Padrão |
|---------|--------|
| Posição | `top-right` |
| Duração | `4800ms` (default) |
| Tema | `light` |
| Cores | vars `--toastify-color-*`; **success** → `--primary` / `--accent` (Azul Royal) |
| Progress bar | success → gradiente `--primary` → `--accent`; demais tipos → `--*-emphasis` |
| Tipos | success → **azul marca**; error → vermelho; warning → âmbar; info → azul info |

## Carregamento (loading)

| Elemento | Padrão |
|----------|--------|
| Barra global (topo) | `GlobalSpinner` — `bg-primary` |
| Spinners de página | `Loader2` com `text-primary`, ou `LoadingSpinner` em `src/components/ui/LoadingSpinner.tsx` |
| Spinners em botão | herdam `currentColor` do botão (sem classe extra) |

**Evitar:** `text-green-500`, `text-emerald-*`, `bg-emerald-*` em indicadores de carregamento (legado Movix).

### O que evitar

- Classes custom (`movix-toast`) que alterem padding, posição do close ou progress bar.
- Cores hardcoded fora dos tokens em `toastify.css`.

## Botões (`Button`)

| Size | Altura / padding | Gap ícone |
|------|------------------|-----------|
| `default` | `h-9`, `px-4` | `--spacing-sm` |
| `sm` | `h-8`, `px-3` | `--spacing-sm` |
| `lg` | `h-10`, `px-6` | `--spacing-sm` |

Variants existentes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Usar `destructive` para acções irreversíveis; feedback de erro de API via toast, não botão.

## Cards (`Card`)

| Parte | Spacing |
|-------|---------|
| Container | `gap-6` (= `--spacing-xl` entre secções) |
| Header / Content / Footer | `px-6` horizontal |
| Border | `border-border/80`, `rounded-2xl` |

## Inputs (`Input`)

| Aspecto | Padrão |
|---------|--------|
| Altura | `h-9` |
| Padding horizontal | `px-3` |
| Radius | `rounded-lg` |
| Fundo | `bg-input-background` |
| Erro | `aria-invalid` + ring/border `destructive` |

## Badges (`Badge`)

Variants: `default`, `secondary`, `destructive`, `outline`, **`success`**, **`warning`**, **`info`**.

Usar variants semânticos para status (ex.: “Pago”, “Atrasado”, “Pendente”) em vez de classes Tailwind soltas.

## Alerts (`Alert`)

Variants: `default`, `destructive`, **`success`**, **`warning`**, **`info`**.

Grid com ícone: gap horizontal `--spacing-md`; ícone `size-4`. Preferir Alert inline em formulários; toast para feedback pós-ação.

## Política de uso futuro

1. **Novos componentes** em `src/components/ui/`: usar tokens documentados.
2. **Sem hex soltos** em UI compartilhada sem justificativa no cycle.
3. **Sem spacing aleatório** — escolher da escala xs–xl.
4. **Preferir padrão existente** antes de criar variante nova.
5. **Migração incremental** de telas legadas: inventariar no cycle; não varrer no mesmo PR.
6. **Feedback pós-ação:** toast; **erro de formulário:** `aria-invalid` + mensagem inline ou Alert.

## Plano incremental (fora deste cycle)

- Migrar hex soltos em `FormVeiculo.tsx`, páginas backoffice e similares.
- Dark mode para toasts e tokens semânticos.
- E2E que asserta presença de toast em fluxos críticos.
- Variants semânticos em mais componentes (ex.: tabs, status pills custom).

## Referências de design — Stitch (Lignum)

As telas de UX/UI do Lignum foram desenhadas no Stitch e ficam em `design/stitch/`. Cada tela
traz `screen.png` (alvo visual) + `code.html` (protótipo HTML/Tailwind via CDN — base de layout,
não plugável direto no Next). O design system do Stitch está em `design/stitch/STITCH-DESIGN.md`.
Cada tela está mapeada ao cycle que a implementa. O dev recria a UI em Next/Tailwind/shadcn,
mas **os tokens desta spec têm precedência** sobre qualquer cor/spacing divergente no Stitch.

14 das 18 telas vieram do Stitch. Faltam 4 (têm `README.md` apontando a base): `02-usuarios-
permissoes`, `04-cliente-detalhe`, `08-ficha-tecnica`, `10-os-detalhe`.

| Tela (pasta em `design/stitch/`) | Cycle |
|---|---|
| `00-login`, `01-painel-dashboard` | 0623-fundacao-rebrand-core |
| `02-usuarios-permissoes` | 0629-auth-usuarios-permissoes |
| `03-clientes`, `04-cliente-detalhe`, `05-empresa-configuracoes` | 0706-cadastros-clientes-cpf-cnpj |
| `06-orcamentos-lista`, `07-orcamento-novo`, `08-ficha-tecnica` | 0713-orcamentos-fichas-pdf |
| `09-producao-kanban`, `10-os-detalhe`, `11-estoque-materiais`, `12-carrocerias-usadas`, `13-funcionarios` | 0720-producao-os-estoque |
| `14-financeiro` | 0727-financeiro-lucro |
| `15-notas-fiscais`, `16-relatorios` | 0803-nf-relatorios |
| `17-configurador-3d` (só moldura; 3D real via r3f) | 0810-3d-homologacao-golive |

Instruções de exportação e nomenclatura: `design/stitch/README.md`.

> **Paleta Lignum (origem da marca):** Azul Royal `#0234C9` (primary), Azul Claro `#046CEB`
> (accent), Preto `#000000` (sidebar), Branco `#FFFFFF`. Definida em `src/styles/theme.css` e
> `src/lib/brand.ts`. O rebrand dos tokens `--lignum-space-*`/`--movix-*` para `--lignum-*` é
> tarefa do cycle 0623.

## Referências

- Frontend / estados obrigatórios: [`frontend.md`](frontend.md)
- Estilo de código: [`code-style.md`](code-style.md)
- Workflow SDD: [`development-workflow.md`](development-workflow.md)
