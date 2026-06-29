# Architecture

## Stack

- **Next.js 15** (App Router, React 19, Turbopack dev).
- **TypeScript 5.7** em `strict`.
- **Prisma 6** sobre **PostgreSQL (Neon)**.
- **NextAuth v5 (beta)** — provider `Credentials`, sessão JWT.
- **React Query 5** para todo o estado servidor no cliente.
- **Tailwind CSS 4** + **Radix UI** + componentes locais em `src/components/ui/`.
- **Zod** para validação de entrada nas rotas de API e forms.
- **react-toastify** para feedback transiente.
- **bcryptjs** para hash de senhas.
- **Vercel Blob** — dependência instalada, **não utilizada neste ciclo**.
- **@react-pdf/renderer** — geração de PDF **server-side** (cycle 0614). Usa fontes Type1 nativas (Helvetica) para manter o build serverless determinístico, sem fetch de fontes em runtime.

## Estrutura de diretórios

```
src/
  app/
    (main)/                 # grupo autenticado; layout com AppShell (Topbar + Sidebar)
      <area>/page.tsx       # páginas por domínio (clientes, veiculo, contratos, ...)
      [[...slug]]/page.tsx  # catch-all legado (MainShell)
    api/<recurso>/route.ts  # Route Handlers (GET/POST/PUT/DELETE)
    login/                  # rota pública
    politica-privacidade/   # LGPD
    error.tsx, not-found.tsx
    layout.tsx, providers.tsx, globals.css
  components/
    ui/                     # primitivos (button, input, dialog, pagination, ...)
    pages/                  # telas compostas (Painel, Estoque, FormVeiculo, ...)
    <domínio>/              # components específicos
    AppShell.tsx, Sidebar.tsx, Topbar.tsx, GlobalSpinner.tsx
  hooks/                    # useVehicles, useClients, ... (React Query)
  services/internal/        # clientes HTTP por domínio (usam apiFetch)
  lib/                      # utilitários (auth, db, apiClient, jsonResponse, zodSchemas, ...)
    pdf/                    # geração de PDF (renderer + templates por ContractType) — cycle 0614
  types/                    # tipos de domínio e ambient module
  middleware.ts             # guarda de sessão para páginas e APIs
prisma/
  schema.prisma
  migrations/
  seed.ts
spec/                       # hub canônico (este diretório)
cycles/                     # ciclos de trabalho (plan/tasks/scenarios)
```

## Camadas

1. **Prisma** — acesso único ao banco via `src/lib/db.ts` (singleton em dev).
2. **Route Handlers** (`src/app/api/**/route.ts`) — validam com Zod, autorizam com
   `withRole`, retornam no envelope padrão (`jsonResponse`).
3. **Services internos** (`src/services/internal/**`) — usam `apiFetch` (client-side)
   para consumir as rotas locais e já desempacotam `data`/erro.
4. **Hooks React Query** (`src/hooks/use*.ts`) — exportam `useXxx`, `useCreateXxx`,
   `useUpdateXxx`, `useDeleteXxx`. Sucesso → `toast.success` com mensagem de domínio.
   Erro → `toast.apiError(err)` (mensagem vinda do backend em PT-BR).
5. **UI** (`src/components/**` + `src/app/(main)/**/page.tsx`) — consome os hooks,
   não faz `fetch` direto.

## Single-tenant (cycle 0623 — ADR-0006)

Uma instalação **Lignum Gestão** = **uma fábrica** = **um banco PostgreSQL**. Sem `Tenant`, `tenantId`, `super_admin`, storefront ou plataforma multi-loja.

- **Acesso a dados:** `prisma` singleton em `src/lib/db.ts`; route handlers usam o client directamente (sem `forTenant`).
- **Autorização:** `withRole` valida sessão JWT + role; escopo por `ownerUserId` ou papel quando aplicável (ver [`security/authorization-matrix.md`](./security/authorization-matrix.md)).
- **ErpSetting:** singleton `id = 1` (dados da fábrica AlaCruz/Lignum).
- **Superfície removida (delete físico):** vitrine/storefront, `/plataforma/**`, cadastro público `/cadastro`, `/fipe`, `/giro`, `/site`; middleware de subdomínio e headers internos de tenant.

### Core vs domínio (ADR-0007)

Fronteira **lógica** documentada (sem mover pastas neste cycle):

| Camada | Exemplos |
|--------|----------|
| **Core** | auth/RBAC, `ErpSetting`, financeiro, inbox, PDF, relatórios, calendário, documentos, leads CRM |
| **Domínio** (cycles 0629+) | carrocerias, orçamentos, produção, materiais; adaptação `Vehicle` → `UsedBody` (cycle 0720) |

Itens Movix de revenda (Estoque, Veículo, FIPE, Giro, Site) **ocultos da sidebar**; rotas e APIs preservadas em dev até cycles de domínio.

## Multitenant (histórico — superseded por ADR-0006)

> **Superseded.** Cycles 0614–0617 implementaram multitenant row-level (`Tenant`, `tenantId`, `super_admin`, storefront por subdomínio). Removido no cycle `0623-fundacao-rebrand-core`. ADR-0002, ADR-0003 e ADR-0004 permanecem no log como histórico.

<details>
<summary>Arquitectura multitenant anterior (referência)</summary>

- Isolamento row-level com `tenantId` em 16 models; `forTenant()` em `src/lib/db.ts`.
- `super_admin` para plataforma; storefront por subdomínio (`Tenant.slug`).
- Ver ADR-0002, ADR-0003, ADR-0004.

</details>

## Convenções

- `id` em rotas é **inteiro positivo**; `documentId` existe no schema por legado
  Strapi mas **não** é chave de rota.
- Paginação default: `page=1, pageSize=10` (máx. 100).
- Datas: `DateTime` (Prisma) com `@db.Date` quando apenas data; no front serializadas
  em ISO.
- Dinheiro: `Decimal(14,2)` no Prisma; `src/lib/money.ts` para formatação.
- Uploads: `src/app/api/upload` existe mas está desativado neste ciclo; campos que
  referenciam mídia (`mainPhotoUrl`, `galleryUrls`, `attachmentUrls`) são strings
  que serão preenchidas via integração futura.

## Fluxos transversais

- **Sessão**: ver [`auth.md`](./auth.md).
- **Erros**: ver [`api-contract.md`](./api-contract.md) e [`ux.md`](./ux.md).
- **Dados**: ver [`data-model.md`](./data-model.md).

## Roles (autorização)

O sistema usa roles persistidas em `User.role` (enum `Role` no Prisma). O conjunto canônico de roles está documentado em [`features/auth/readme.md`](./features/auth/readme.md#roles-mudança-de-produto) e é aplicado via `withRole`/middleware nas rotas `src/app/api/**`.

## Integrações externas

Padrão partilhado para serviços que chamam terceiros — aplicável a **SENATRAN** (veículo) e **document lookup** (CNPJ cadastral, cycle 0706):

| Camada | SENATRAN | Document lookup (CNPJ) |
|--------|----------|------------------------|
| Adapters | `src/lib/senatran/*` | `src/lib/documentLookup/*` |
| Env provider | `SENATRAN_PROVIDER` | `DOCUMENT_LOOKUP_PROVIDER` |
| Cache | placa normalizada | CNPJ dígitos (`lookupMemoryCache.ts`) |
| Audit | `SenatranLookupAudit` | `DocumentLookupAudit` |
| Telemetria | `senatran_*` | `document_lookup_*` |
| Falha terceiro | não bloqueia cadastro manual | não bloqueia cadastro manual |

1. **Adapter isolado** — interface estável no domínio; implementações concretas por provedor (`mock`, `http`, `brasilapi`, …). Trocar o provedor não altera rotas HTTP da app nem o contrato dos DTOs expostos ao frontend.
2. **Configuração** — URLs, chaves e flags de provider apenas via **variáveis de ambiente**; ambientes distintos (dev/preview/prod) com credenciais distintas.
3. **Resiliência** — timeout explícito; retries limitados só para erros idempotentes e transitórios; falha do terceiro **nunca** bloqueia o fluxo manual do operador.
4. **Cache** — respostas normalizadas com TTL configurável (default 24h) para reduzir custo; chave específica por domínio (placa vs. CNPJ).
5. **Observabilidade** — logs estruturados por consulta (sucesso/erro); eventos de produto com prefixo estável; custo por consulta registado para agregação mensal (admin).
6. **Compliance** — ver [`security/lgpd.md`](./security/lgpd.md) (payloads de terceiros; distinção titular veicular vs. contraparte comercial) e [`audit/readme.md`](./audit/readme.md) (snapshots e acesso admin-only).

Detalhe de UI e regras de negócio: [`features/vehicles/readme.md`](features/vehicles/readme.md), [`features/document-lookup/readme.md`](features/document-lookup/readme.md).
