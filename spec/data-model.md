# Data Model

Fonte única: [`prisma/schema.prisma`](../prisma/schema.prisma).
Este documento resume o modelo canônico Lignum pós-cycle `0720-producao-os-estoque`.

## Entidades e relacionamentos

```
ErpSetting (singleton id=1)

User ──< UserNotification, DocumentLookupAudit, AuditLog, ...

Client ──< ClientDocument
       ──< Quote >── BodyModel?
       ──< StorefrontLead

Quote ──< QuoteItem
      ──|── TechnicalSheet (1:1 após conversão)
      └──|── ProductionOrder (1:1 após conversão)

ProductionOrder ──< ProductionOrderEmployee >── Employee
                ──< StockMovement (saídas/estornos)

Material ──< StockMovement
         >── Supplier?

UsedBody ──< UsedBodyStatusHistory
         >── Supplier?

Employee >── User? (opcional)

Supplier, Payable, FinanceNotificationDispatch, ...
```

### Cadastro comercial (cycle 0706)

- **`Client.registrationStatus?`** / **`Supplier.registrationStatus?`** — situação cadastral CNPJ.
- **`DocumentLookupAudit`** — auditoria de consultas CNPJ cadastrais (admin-only).

## Single-tenant (cycle 0623 — ADR-0006)

- **Sem `Tenant` nem `tenantId`** em qualquer model.
- **`User`** pertence à instalação; roles de fábrica apenas.
- **`ErpSetting`** singleton **`id = 1`**.
- Isolamento por **RBAC** (`withRole`) e **`ownerUserId`** onde aplicável.

## Enums Lignum (produção e estoque — cycle 0720)

- `ProductionOrderStatus`: `aguardando` | `andamento` | `concluida` | `cancelada`
- `UsedBodyStatus`: `disponivel` | `reservada` | `vendida` | `em_reforma`
- `UsedBodyCondition`: `excelente` | `bom` | `regular` | `ruim`
- `MaterialCategory`: `madeira` | `ferragens` | `tintas` | `estrutura` | `tampa` | `assoalho` | `acabamento` | `consumivel` | `opcional`
- `StockMovementType`: `entrada` | `saida` | `estorno`

## Enums comerciais (orçamentos — cycle 0713)

- `Role`: `admin` | `vendedor` | `financeiro` | `producao` | `read_only`
- `QuoteStatus`: `rascunho` | `enviado` | `aprovado` | `convertido` | `cancelado`
- `BodyCoverStyle`, `BodyFloorType`, `BodyFinishType` — configurador paramétrico

## Removidos (teardown Movix — cycle 0720)

Models e enums Movix removidos do schema: `Vehicle`, `Sale`, `Contract`, `Evaluation`, `PurchaseEvaluation`, `ServiceOrder`, `Warranty`, `PromissoryNote`, `UserStockAttentionPreference`, `SenatranLookupAudit` e enums associados (`VehicleStatus`, `FuelType`, `ServiceOrderStatus`, etc.).

Ver ADR-0010 em [`decisions.md`](decisions.md).

## Convenções

- Ids inteiros autoincremento.
- `documentId: String?` unique (legado Strapi; **não** usado em roteamento).
- Colunas monetárias: `Decimal(14,2)`.
- Timestamps: `createdAt @default(now())`, `updatedAt @updatedAt`.

## Regras de integridade notáveis

- `ProductionOrder.quoteId` **unique** — uma OP por orçamento convertido.
- `Material.sku` **unique**.
- Baixa BOM: transacção atómica; bloqueio 409 se saldo insuficiente.
- `UsedBodyStatusHistory` append-only.
- `onDelete SetNull`: `AuditLog.userId` (preserva histórico).

## Campos LGPD (User)

- `lgpdConsentVersion: String?`
- `lgpdConsentAt: DateTime?`
