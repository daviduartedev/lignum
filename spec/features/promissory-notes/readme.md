# Feature: Promissory Notes (Promissórias)

Parcelas/promissórias geradas em vendas/contratos.

## Modelo

`PromissoryNote` — `installmentNumber`, `totalInstallments`, `dueDate`, `amount`,
`status`, `paymentDate?`, `notes?`, `clientId`, `vehicleId`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/promissory-notes?page&pageSize&status&dueBefore`
- `POST /api/promissory-notes`
- `GET /api/promissory-notes/[id]`
- `PUT /api/promissory-notes/[id]`
- `DELETE /api/promissory-notes/[id]`

## UI

- **Ponto de entrada canónico (área de produto):** [Financeiro (A Pagar / A Receber)](../financeiro/readme.md) — sub-navegação **A Receber** em `/financeiro` (a UI pode usar query interna, ex. `?view=receber`).
- **Rotas legadas (compatibilidade):** se ainda expostas, `GET /promissorias[...] ` **redirecionam** para o Financeiro (sub-vista Receber) sem perder a necessidade de links antigos. Novos links e menus devem apontar para **`/financeiro`**, não para `/promissorias`.
- Criação e detalhe: podem manter ` /promissorias/nova` e ` /promissorias/[id]` com redirect para equivalente sob `/financeiro` quando a rota for unificada, ou viverem apenas como filhos de `/financeiro` — o contrato de URL final documenta-se na tarefa de implementação, mantendo **redirect** mínimo.

## Estados

`aberta` → `paga` (com `paymentDate`) | `vencida` (ultrapassou `dueDate`) |
`cancelada`.

## Relacionamentos

- `Client` (Restrict), `Vehicle` (Restrict).
