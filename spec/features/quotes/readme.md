# Orçamentos (Quote)

Cycle `0713-orcamentos-fichas-pdf`.

## Domínio

Orçamento paramétrico de carroceria: medidas, tampa, assoalho, acabamento, opcionais → motor de preço → PDF → conversão em ficha técnica (BOM).

## Models

- `BodyModel` — catálogo de modelos base (`basePrice`, `pricePerM2`).
- `Quote` — orçamento com status `rascunho` → `enviado` → `aprovado` → `convertido` | `cancelado`.
- `QuoteItem` — linhas calculadas (material, labor, option).
- `TechnicalSheet` — BOM gerada na conversão (`bomJson`).

## API

| Método | Rota | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/quotes` | staff read | Paginação; `q`, `status` |
| POST | `/api/quotes` | commercialWrite | Cria com itens calculados |
| GET/PUT/DELETE | `/api/quotes/[id]` | read / write | Edição bloqueada se `convertido` |
| POST | `/api/quotes/calculate` | staff read | Preview sem persistir |
| POST | `/api/quotes/[id]/convert` | commercialWrite | `aprovado` → `TechnicalSheet` |
| GET | `/api/quotes/[id]/pdf` | staff read | PDF binário |
| GET | `/api/quotes/[id]/technical-sheet/pdf` | staff read | PDF BOM |
| GET/POST | `/api/body-models` | read / commercialWrite | Catálogo |

## Configuração

`ErpSetting.quotePricingJson` — margens, taxa horária, sobretaxas e opcionais. UI em `/configuracoes` → Parâmetros de Orçamento.

## UI

- `/orcamentos` — lista (Stitch 06): KPIs sólidos por status
- `/orcamentos/novo` — formulário paramétrico + total ao vivo (Stitch 07)
- `/orcamentos/[id]` — detalhe, transições de status, BOM (Stitch 08)

Componentes reutilizáveis: `src/components/ui/stitch/` (`StitchPageHeader`, `StitchKpiCard`, `StitchSectionCard`, `StitchTableShell`, `EntityAvatar`).

### Cálculo ao vivo (`/orcamentos/novo`)

- `POST /api/quotes/calculate` com debounce ~350 ms ao alterar medidas/opcionais/desconto.
- Card lateral **Total estimado**: cabeçalho azul royal sólido com valor; lista de itens + subtotais abaixo.
- Estado inicial calcula com medidas default (4,20 × 2,10 × 1,80 m); não deve entrar em loop de loading.

### Copy e tipografia (P0)

- Interface PT-BR: **não usar travessão longo (`—`)** em labels, placeholders ou textos de UI/PDF; usar `-`, `·` ou frase completa.

## Motor de preço

`src/lib/quotes/pricingEngine.ts` — testável; parâmetros de `quotePricingJson`.
