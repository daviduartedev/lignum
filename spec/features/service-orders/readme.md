# Feature: Service Orders (OS)

Ordens de serviço (manutenção, revisão, funilaria, etc.) sobre veículos.

## Modelo

`ServiceOrder` — `workshopName`, `serviceType`, `serviceTypeOtherText?`, `status`, `entryDate`, `dueDate?`,
`responsible?`, `description?`, `partsJson?`, `laborJson?`, `totalAmount`,
`photoUrls[]`, `vehicleId`.

### Campo `serviceTypeOtherText`

- Quando `serviceType = "outros"`, o operador informa um texto livre para detalhar o serviço.
- Validação:
  - Obrigatório quando `serviceType = "outros"`.
  - Mínimo: 5 caracteres.
  - Sem máximo definido.
- Exibição (onde o tipo de serviço aparece):
  - Se `serviceType = "outros"` e `serviceTypeOtherText` preenchido: **"Outros — {texto}"**.
  - Se `serviceType = "outros"` e `serviceTypeOtherText` ausente (OS legado): **"Outros (não informado)"**.

## Busca

- Em listagens, a pesquisa deve considerar também `serviceTypeOtherText` quando presente (além dos campos já pesquisáveis).

## Endpoints (`withRole(staffRoles)`)

- `GET /api/service-orders?page&pageSize&status`
- `POST /api/service-orders`
- `GET /api/service-orders/[id]`
- `PUT /api/service-orders/[id]`
- `DELETE /api/service-orders/[id]`

## UI

- Lista: `/os`.
- Criação: `/os/nova`.
- Detalhe: `/os/[id]`.

### Itens do serviço (seção única)

- A UI deve apresentar uma única seção **"Serviço"** para lançamento de itens, sem exigir separação entre "Peças" e "Mão de obra" para o operador.
- Compatibilidade e persistência:
  - Não migrar dados destrutivamente.
  - Manter os campos internos existentes (`partsJson` e `laborJson`) e mapear a seção única para esses campos de forma compatível com OS já criadas.

## Relacionamentos

- `Vehicle` (Cascade).
