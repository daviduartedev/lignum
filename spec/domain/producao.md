# Domínio — Produção Lignum

Cycle `0720-producao-os-estoque`.

## Fluxo principal

1. Orçamento `aprovado` → `POST /api/quotes/[id]/convert` → `TechnicalSheet` + `ProductionOrder` (`aguardando`).
2. `POST .../start` → `andamento` + baixa BOM (`deductBomStock`).
3. `POST .../complete` → `concluida`.
4. `POST .../cancel` → `cancelada`; estorno de materiais se estava `andamento`.

## Invariantes

- `ProductionOrder.quoteId` unique (uma OP por orçamento convertido).
- Funcionários imutáveis após `concluida`.
- Baixa BOM transacional; 409 se SKU ausente ou saldo insuficiente.

## Referências

- Feature: [production-orders](../features/production-orders/readme.md)
- Orçamentos: [quotes](../features/quotes/readme.md)
