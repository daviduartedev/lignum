# Feature: Contracts

Contratos comerciais (compra-venda, financiamento, consórcio, locação).

## Modelo

`Contract` — `contractType`, `contractValue`, `contractDate`, `status`,
`specialClauses?`, testemunhas 1/2 (nome + documento), `vehicleId`, `clientId`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/contracts?page&pageSize&status`
- `POST /api/contracts`
- `GET /api/contracts/[id]`
- `PUT /api/contracts/[id]`
- `DELETE /api/contracts/[id]`
- `GET /api/contracts/[id]/pdf` — PDF preenchido do contrato (`application/pdf`, `Content-Disposition: attachment`).

## PDF preenchido (cycle 0614)

Geração **server-side** com `@react-pdf/renderer` (primeira capacidade do tipo no projeto; ver [architecture.md](../../architecture.md)).

- Endpoint `GET /api/contracts/[id]/pdf`: carrega `Contract` + `Vehicle` + `Client` via `ctx.db` (escopo de tenant; 404 cross-tenant) e o emissor de `ErpSetting`; responde `application/pdf` com `Cache-Control: private, no-store` e headers de segurança canônicos.
- Renderer em `src/lib/pdf/` resolve o template por `ContractType` (compra_venda, financiamento, consorcio, locacao). Conteúdo jurídico é **rascunho** (banner "MODELO PROVISORIO" no PDF) até validação jurídica.
- `ContratoForm`: botão **Baixar PDF** (fetch+blob) como ação primária; **Imprimir** (`window.print()`) permanece como ação secundária.

> O PDF de contrato é acionado a partir de **`/contratos`** (lista/detalhe e `ContratoForm`). A central `/documentos` permanece restrita a mídias por veículo — ver [client-documents/readme.md](../client-documents/readme.md).

## Estados

`ContractStatus`: `rascunho` → `pendente_assinatura` → `assinado`; ou `cancelado`
a qualquer momento.

## UI

- Lista: `/contratos`.
- Criação: `/contratos/novo`.
- Detalhe: `/contratos/[id]`.

## Relacionamentos

- `Vehicle` (Restrict), `Client` (Restrict) — protege histórico.
