# Feature: Painel (dashboard Lignum)

Cycle `0713-orcamentos-fichas-pdf` (shell Stitch 01); KPIs reais de produção/financeiro no cycle `0727-financeiro-lucro`.

## Objetivo

Visão geral da operação industrial Lignum: indicadores comerciais, produção, alertas e últimos orçamentos. Layout **`design/stitch/01-painel-dashboard`**.

> **Movix removido (0720):** KPIs de revenda de veículos, `GET /api/dashboard/summary` e superfícies `/estoque` veículos eliminados.

## Rotas e UI

- Rota: **`/`** — `src/components/pages/Painel.tsx`
- Subcomponentes: `src/components/painel/` (`PainelKpiCard`, `PainelCharts`, `PainelAlerts`, `PainelRecentQuotesTable`, `painelMockData.ts`)

## Layout (Stitch 01)

| Bloco | Descrição |
|-------|-----------|
| Cabeçalho | «Painel de Controle»; Exportar (toast); **Novo Orçamento** → `/orcamentos/novo` |
| 4 KPIs | Faturamento, Lucro, Em Produção, Orçamentos Pendentes — mock até 0727 |
| Gráficos | Faturamento x Lucro; Produção por Mês — mock |
| Alertas | Coluna direita — mock |
| Tabela | Últimos Orçamentos — `GET /api/quotes` (4 itens) |
| FAB | Botão `+` fixo → **`/producao`** (tooltip «Produção») |

## Dados (v1 pós-0720)

| Área | Fonte |
|------|--------|
| KPIs, gráficos, alertas mock | `painelMockData.ts` até 0727 |
| Últimos orçamentos | API `/api/quotes?page=1&pageSize=4` |
| Badges de status | `src/lib/quoteLabels.ts` (centralizado) |
| Em Produção (futuro) | `ProductionOrder` status `andamento` — 0727 |

## Fora de âmbito nesta entrega

- KPIs e gráficos financeiros reais (cycle 0727)
- Widgets Movix (removidos)

## Referências

- Orçamentos: [features/quotes](../quotes/readme.md)
- Produção: [features/production-orders](../production-orders/readme.md)
