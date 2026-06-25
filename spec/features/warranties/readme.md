# Feature: Warranties

Garantias de veículos vendidos.

## Modelo

`Warranty` — `warrantyType`, `startDate`, `endDate`, `coverageValue`, `status`,
`notes?`, `vehicleId`, `clientId`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/warranties?page&pageSize&status`
- `POST /api/warranties`
- `GET /api/warranties/[id]`
- `PUT /api/warranties/[id]`
- `DELETE /api/warranties/[id]`

## UI

- Lista: `/garantias`.
- Criação: `/garantias/nova`.
- Detalhe: `/garantias/[id]`.

## Regras

- `endDate >= startDate` (validação Zod).
- Status `vencendo` / `expirada` pode ser derivado por job futuro; hoje é manual.

## Relacionamentos

- `Vehicle` (Cascade), `Client` (Restrict).
