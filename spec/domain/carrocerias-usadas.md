# Domínio — Carrocerias usadas

Cycle `0720-producao-os-estoque`.

## Status e histórico

Toda criação e mudança de `status` grava `UsedBodyStatusHistory` (append-only).

## RBAC por operação

| Operação | Papéis |
|----------|--------|
| Criar / editar campos gerais | `commercialWrite` (admin, vendedor) |
| Status `em_reforma` | `productionWrite` (admin, producao) |
| DELETE | admin |

## Referências

- Feature: [used-bodies](../features/used-bodies/readme.md)
