# Feature: Clients

Cadastro de **clientes e fornecedores** no mesmo hub da revenda (pessoas físicas/jurídicas que interagem com o ERP como compradores ou contrapartes em cadastros comerciais).

## Modelo

`Client` — `fullName`, `document`, `email`, `phone?`, `address?`, **`personType?`** (`PersonType`: `PF` | `PJ`).

- **`personType`** opcional (nullable). Quando `PF`: máscara **CPF** no campo `document`; quando `PJ`: máscara **CNPJ**; quando ausente: default **CPF** na UI.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/clients?page&pageSize`
- `POST /api/clients`
- `GET /api/clients/[id]`
- `PUT /api/clients/[id]`
- `DELETE /api/clients/[id]`

## Validação

- `fullName`, `document`, `email` obrigatórios.
- `document` com máscara CPF/CNPJ (`src/lib/masks.ts`); unicidade **não** forçada no
  DB (múltiplos cadastros com mesmo doc são aceitos mas desencorajados pela UI).

## UI

- Hub e lista (clientes + separador de fornecedores): **`/clientes`** — rótulos canónicos **Clientes e fornecedores** no menu lateral, topbar e título da página em PT-BR coerente com o hub.
- Detalhe: `/clientes/[id]` (inclui histórico via `HistoricoCliente.tsx`).
- Criação: `/clientes/novo`.
- Edição: `/clientes/[id]/editar`.
- **Dialog de novo cliente na venda** (`/venda/[id]`, etapa 1): além de nome, documento e e-mail, inclui **tipo PF/PJ** (select), **telefone** e **endereço** (campo texto único `address`, label "Endereço (rua, nº, bairro, cidade)"). Endereço **não** subdividido em colunas neste ciclo.

## Relacionamentos

- Sale (Restrict), Contract (Restrict), Warranty (Restrict), PromissoryNote
  (Restrict), ClientDocument (Cascade), Vehicle (opcional como comprador).
- Exclusão é bloqueada se houver histórico comercial → resposta `409 CONFLICT`
  com mensagem "Cliente possui registros vinculados e não pode ser removido."
