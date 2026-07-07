# Domínio — Estoque de matérias-primas

Cycle `0720-producao-os-estoque`.

## Custo médio ponderado

Em `entrada` com `unitCost`: novo `avgCost = (saldo × avgCost + qty × unitCost) / (saldo + qty)`.

## Tipos de movimento

| Tipo | Origem | Efeito |
|------|--------|--------|
| `entrada` | UI manual / seed | +saldo, actualiza avgCost |
| `saida` | UI manual / start OP | −saldo; 409 se insuficiente |
| `estorno` | cancel OP | +saldo (reverte saída) |

## Alertas

Material com `currentStock < minStock` → `UserNotification` idempotente; secção inbox `materialLowStock`.

## Referências

- Feature: [materials-stock](../features/materials-stock/readme.md)
