# Ordens de Produção (ProductionOrder)

Cycle `0720-producao-os-estoque` (substitui OS Movix).

## Domínio

Ordem de produção Lignum: criada automaticamente ao converter orçamento aprovado; kanban por status; baixa automática de BOM ao iniciar.

## Models

- `ProductionOrder` — 1:1 com `Quote` após conversão (`quoteId` unique).
- `ProductionOrderEmployee` — N:N com `Employee`.
- `StockMovement` — saídas/estornos ligados à OP.

## Estados e transições

| Status | Transições |
|--------|------------|
| `aguardando` | → `andamento` (start), → `cancelada` (cancel) |
| `andamento` | → `concluida` (complete), → `cancelada` (cancel + estorno BOM) |
| `concluida` | imutável (funcionários bloqueados) |
| `cancelada` | terminal |

## API

| Método | Rota | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/production-orders` | allStaffRead | Paginação; `q`, `status` |
| POST | `/api/production-orders` | productionWrite | Criação manual (raro) |
| GET/PUT | `/api/production-orders/[id]` | read / productionWrite | `employeeIds[]` no PUT |
| POST | `/api/production-orders/[id]/start` | productionWrite | Baixa BOM; 409 se saldo insuficiente |
| POST | `/api/production-orders/[id]/complete` | productionWrite | `andamento` → `concluida` |
| POST | `/api/production-orders/[id]/cancel` | productionWrite | Estorno se estava `andamento` |

Side-effect: `POST /api/quotes/[id]/convert` cria `ProductionOrder` com status `aguardando`.

## UI

- `/producao` — kanban Stitch 09 (colunas por status; busca)
- `/producao/[id]` — detalhe com tabs: BOM, Funcionários, Fotos, Materiais consumidos, Histórico

Componentes: `src/components/producao/ProducaoKanban.tsx`, `ProducaoDetalhe.tsx`.

## Lógica de domínio

- `src/lib/production/deductBomStock.ts` — resolve `bomJson` → SKU; transação atómica; bloqueio 409.
- Estorno em cancel quando OP estava `andamento`.

## Testes

- `tests/api/productionOrders.test.ts`
- `tests/lib/production/deductBomStock.test.ts`
- `e2e/producao-lignum.spec.ts`
