# Estoque de Matérias-Primas (Material + StockMovement)

Cycle `0720-producao-os-estoque` (substitui estoque de veículos Movix).

## Domínio

Catálogo de insumos para produção: saldo, custo médio ponderado, movimentações manuais e automáticas (baixa BOM).

## Models

- `Material` — SKU unique; `currentStock`, `minStock`, `avgCost` denormalizados.
- `StockMovement` — `entrada` | `saida` | `estorno`; ligado opcionalmente a `ProductionOrder`.

## API

| Método | Rota | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/materials` | allStaffRead | Paginação; `q`, `category` |
| POST | `/api/materials` | productionWrite | Novo SKU |
| GET/PUT/DELETE | `/api/materials/[id]` | read / productionWrite | DELETE admin |
| GET/POST | `/api/stock-movements` | read / productionWrite | Entrada exige `unitCost`; saída bloqueia 409 |

## Regras

- Entrada: actualiza `avgCost` ponderado e `currentStock`.
- Saída manual: valida saldo; 409 se insuficiente.
- Alerta mínimo: `UserNotification` idempotente para `admin` + `producao`; link `/estoque/materiais?highlight={id}`.
- SKU BOM (`bomJson`) = SKU material.

## UI

- `/estoque/materiais` — Stitch 11: KPIs, tabela, diálogos entrada/saída, novo material.

Componente: `src/components/producao/EstoqueMateriais.tsx`.

## Seed

SKUs de `src/lib/materials/bomCatalogSeed.ts` (alinhado a `bomBuilder`); `EST-PER` abaixo do mínimo para alertas.

## Testes

- `tests/lib/materials/stockMovement.test.ts`
- `tests/lib/materials/minStockAlert.test.ts`
