# Feature: Painel (dashboard Lignum)

Cycle `0713-orcamentos-fichas-pdf` (shell Stitch 01); KPIs reais de produção/financeiro no cycle `0727-financeiro-lucro`.

## Objetivo

Visão geral da operação industrial Lignum: indicadores comerciais, produção, alertas e últimos orçamentos. O layout segue **`design/stitch/01-painel-dashboard`**.

> **Histórico Movix:** KPIs de revenda de veículos (`GET /api/dashboard/summary`, stock FIPE, etc.) foram **desactivados** no cycle 0713 (ADR-0009). A spec anterior deste ficheiro descrevia esse painel; comportamento legado permanece na API mas **não** é renderizado em `/`.

## Rotas e UI

- Rota: **`/`** — componente `src/components/pages/Painel.tsx`
- Subcomponentes: `src/components/painel/` (`PainelKpiCard`, `PainelCharts`, `PainelAlerts`, `PainelRecentQuotesTable`, `painelMockData.ts`)

## Layout (Stitch 01)

| Bloco | Descrição |
|-------|-----------|
| Cabeçalho | Título «Painel de Controle»; botões Exportar (toast informativo) e Novo Orçamento → `/orcamentos/novo` |
| 4 KPIs | Faturamento do Mês, Lucro Estimado, Em Produção, Orçamentos Pendentes — cards brancos com ícone azul e tendência |
| Gráficos | Faturamento x Lucro (6 meses, SVG); Produção por Mês (barras) |
| Alertas | Coluna direita com 4 alertas coloridos + card «Vista da Fábrica» |
| Tabela | Últimos Orçamentos — dados reais de `GET /api/quotes` (4 itens) ou fallback estático do mock |
| FAB | Botão `+` fixo → `/os/nova` (tooltip «Nova Ordem de Serviço») |

## Dados (v1 pós-0713)

| Área | Fonte |
|------|--------|
| KPIs, gráficos, alertas | Estáticos (`painelMockData.ts`) até integração 0720/0727 |
| Últimos orçamentos | API `/api/quotes?page=1&pageSize=4`; fallback mock se vazio |
| Exportar | Placeholder — exportação real pós-0727 |

## Fora de âmbito nesta entrega

- KPIs e gráficos ligados a financeiro/produção real
- Alertas de estoque mínimo e contas a pagar (cycles 0720, 0727)
- Widgets Movix (veículos parados, marcas vendidas, `dashboard/summary`)

## Referências

- Design: `design/stitch/01-painel-dashboard/code.html`
- ADR-0009 em [`decisions.md`](../../decisions.md)
- Orçamentos: [features/quotes](../quotes/readme.md)
