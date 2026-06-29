# Feature: Client Documents

Documentos anexos ao cadastro do cliente (CNH, comprovantes, contratos externos).

> **Distinção:** o hub **`/documentos`** trata **mídias e anexos por veículo** (não confundir com documentos do cliente em `/clientes/[id]`). Contratos têm hub próprio em **`/contratos`**.

## Hub `/documentos` (documentos de veículo)

- **Sem** tab ou KPI de contratos — contratos apenas em `/contratos`.
- Listagem de veículos com: placa no padrão **Mercosul** (`MercosulPlate`, ex. `ABC1D23`), badge de status via helper centralizado (`vehicleStatusBadgeClass` / `vehicleStatusLabel`, mesmas cores que [Estoque](../estoque/readme.md)).
- Botão **Abrir:** abre `attachmentUrls[0]` (primeiro anexo) em **nova aba** (`target="_blank"`). Se não houver anexo: botão desabilitado com tooltip/title **"Sem anexos"** — **não** redireciona para ficha do veículo.

## Modelo (documentos do cliente)

`ClientDocument` — `title`, `notes?`, `externalUrl?`, `documentFileUrl?`, `clientId`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/client-documents?clientId&page&pageSize`
- `POST /api/client-documents`
- `GET /api/client-documents/[id]`
- `PUT /api/client-documents/[id]`
- `DELETE /api/client-documents/[id]`

## Validação

- `title` e `clientId` obrigatórios.
- Pelo menos um de `externalUrl` ou `documentFileUrl` deve estar presente.
- Upload via `POST /api/upload` (gate env) → `documentFileUrl`; URL externa sempre disponível.

## UI

- Integrado a `/clientes/[id]` (aba Documentos) e `/clientes/[id]/editar` (`ClientDocumentsSection`).

## Relacionamentos

- `onDelete: Cascade` em relação a `Client`.
