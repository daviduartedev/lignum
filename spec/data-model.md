# Data Model

Fonte única: [`prisma/schema.prisma`](../prisma/schema.prisma).
Este documento resume o modelo canônico.

## Entidades e relacionamentos

```
ErpSetting (singleton id=1)

User ──< UserNotification, SenatranLookupAudit, UserStockAttentionPreference, ...

Client ──< Sale          >── Vehicle
       ──< Contract      >── Vehicle
       ──< Warranty      >── Vehicle
       ──< PromissoryNote>── Vehicle
       ──< ClientDocument
       ──< Vehicle (VehicleBuyer, opcional)

Vehicle ──┬── Sale (1..1, unique vehicleId)
          ├──< Contract, Evaluation, ServiceOrder, Warranty, PromissoryNote, ...

Supplier, Payable, StorefrontLead, FinanceNotificationDispatch, ...
```

## Single-tenant (cycle 0623 — ADR-0006)

- **Sem `Tenant` nem `tenantId`** em qualquer model.
- **`User`** pertence à instalação (sem FK tenant); roles de loja/fábrica apenas.
- **`ErpSetting`** singleton **`id = 1`** — dados da fábrica; campos de vitrine/subdomínio removidos.
- Isolamento por **RBAC** (`withRole`) e **`ownerUserId`** onde aplicável; ver [`architecture.md`](./architecture.md).

## Multitenant (histórico — superseded)

> Removido no cycle `0623`. Ver ADR-0006. Diagrama anterior incluía `Tenant ──< ...` e `ErpSetting` 1:1 por `tenantId`.

## Enums

- `Role`: `admin` | `authenticated` | `public` | `sales` | `finance` | `read_only`. Sem `super_admin` (removido no cycle 0623).
- `VehicleStatus`: `disponivel` | `repasse` | `reservado` | `vendido` | `removido`.
- `VehicleLegalSituation` (alvo SENATRAN): `regular` | `irregular` | `com_restricao` — situação legal do veículo na fonte consultada; **não** confundir com `VehicleStatus` de estoque.
- `VehicleCategoryKind` (alvo): `carro` | `moto` | `onibus` | `jet_ski` | `outros`.
- `VehicleCautelar` (alvo): `nao` | `leilao` | `sinistro` | `leilao_sinistro` | `outras_restricoes`.
- `FuelType`: `flex` | `gasolina` | `diesel` | `eletrico` | `hibrido`.
- `TransmissionType`: `manual` | `automatico` | `cvt`.
- `PaymentMethod`: `financiamento` | `a_vista` | `cartao` | `troca` | `pix`.
- `ContractType`: `compra_venda` | `financiamento` | `consorcio` | `locacao`.
- `ContractStatus`: `rascunho` | `pendente_assinatura` | `assinado` | `cancelado`.
- `ServiceOrderType`: `manutencao` | `revisao` | `funilaria` | `eletrica` | `mecanica` | `estetica` | `outros`.
- `ServiceOrderStatus`: `aguardando` | `andamento` | `concluida` | `cancelada`.
- `WarrantyType`: `motor_cambio` | `completa` | `motor` | `acessorios` | `outros`.
- `WarrantyStatus`: `ativa` | `vencendo` | `expirada` | `cancelada`.
- `PromissoryNoteStatus`: `aberta` | `paga` | `vencida` | `cancelada`.

## Vehicle — extensão SENATRAN (alvo)

Para além dos campos já listados no Prisma, o produto prevê (entre outros) `renavam`, `chassis`, tipo (`VehicleCategoryKind`), situação legal (`VehicleLegalSituation`), cautelar (`VehicleCautelar`), município/UF de emplacamento, título de anúncio, JSON de **outros dados oficiais**, e metadados de origem por campo. Fonte canónica após migração: [`prisma/schema.prisma`](../prisma/schema.prisma) e [Vehicles](features/vehicles/readme.md).

## Convenções

- Ids inteiros autoincremento.
- `documentId: String?` unique em quase todas as tabelas (legado Strapi; **não**
  usado em roteamento — ver [`api-contract.md`](./api-contract.md)).
- Colunas monetárias: `Decimal(14,2)`.
- Datas apenas-data: `DateTime @db.Date`.
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`.
- Arrays de URL (mídia): `String[]` com `@default([])`.

## Regras de integridade notáveis

- `Sale.vehicleId` é **unique** → tentar vender duas vezes o mesmo veículo
  gera `409 CONFLICT`.
- `onDelete`:
  - `Cascade`: `ClientDocument` (por cliente), `Evaluation`/`ServiceOrder` (por
    veículo), `UserNotification` (por usuário), `Sale` (por veículo); **`tenantId` em todos os models de negócio (apagar um Tenant remove seus dados)**.
  - `Restrict`: `Contract`, `Warranty`, `PromissoryNote` em relação a `Client` e
    `Vehicle` — protege histórico comercial.

## Campos LGPD (User)

Adicionados neste ciclo:

- `lgpdConsentVersion: String?` — versão do texto aceito (vem de `src/lib/lgpdPolicyMeta.ts`).
- `lgpdConsentAt: DateTime?` — momento do aceite.
