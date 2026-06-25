> **REMOVIDA no cycle `0623-fundacao-rebrand-core`.** Plataforma multi-loja e role `super_admin` eliminados. Referência histórica apenas.

# Feature: Onboarding de lojas (plataforma / super_admin) — DEPRECATED

Painel self-service para o **`super_admin`** cadastrar revendas (tenants) e o utilizador dono (`admin` da loja), sem intervenção manual no banco. Cycle `0617`.

Ver também: [Auth](../../auth.md), [API contract](../../api-contract.md), [Matriz de autorização](../../security/authorization-matrix.md), [ERP Setting](../erp-setting/readme.md), [Vitrine](../storefront/readme.md).

## Actor

- **`super_admin`** — único papel com acesso à UI e API de plataforma (`tenantId = null`, cross-tenant auditado).

## Rotas UI

| Rota | Acesso | Propósito |
|------|--------|-----------|
| `/plataforma/lojas` | `super_admin` | Listagem paginada com busca |
| `/plataforma/lojas/nova` | `super_admin` | Formulário de criação |
| `/plataforma/lojas/nova/sucesso` | `super_admin` | Resumo pós-criação (senha exibida uma vez) |

## Autorização

- Prefixo **`/plataforma/**`**: apenas `super_admin`.
- Staff de loja (`admin`, `sales`, etc.): **404** (anti-enumeração) — middleware + layout `(platform)` com `notFound()`.
- APIs: `GET/POST /api/platform/tenants` via `withSuperAdmin` → **403** a não-super-admin.

## Shell

- Route group `src/app/(platform)/` com **`PlatformShell`** (`src/components/platform/PlatformShell.tsx`).
- Separado do `AppShell` ERP (sem sidebar de estoque/vendas).
- Header: logo (`BrandLogo` com `relative` + dimensões explícitas), título “Gestão de lojas”, logout.

## Pós-login

- `super_admin` sem cookie `returnTo`: destino default **`/plataforma/lojas`** (em `/login` após `signIn`).

## Listagem (`/plataforma/lojas`)

- Consome `GET /api/platform/tenants` paginado.
- Busca client-side via query `q` (nome ou slug, case-insensitive).
- Colunas: nome, slug, `Tenant.active`, vitrine (`siteActive`), contagem utilizadores, contagem veículos, data criação, link URL pública.
- Indicador “Vitrine desligada” quando `siteActive=false`.
- Estados: loading, empty (com/sem busca), error com retry.

## Formulário (`/plataforma/lojas/nova`)

| Campo | Obrigatório | Notas |
|-------|:-----------:|-------|
| Nome da loja | sim | min 2 caracteres |
| Subdomínio | não | Deriva do nome se vazio; `normalizeStoreSubdomain` no servidor |
| Endereço inicial | não | `ErpSetting.siteAddress`; editável depois em `/site` |
| E-mail do dono | sim | Unicidade global |
| Senha do dono | sim | min 8 |
| Nome do dono | não | |

- Preview de subdomínio/URL no client; submit via `POST /api/platform/tenants` apenas (sem duplicar lógica de criação).
- Erros `VALIDATION_ERROR` / `CONFLICT` via `toast.apiError`.

## Pós-criação

- Transação: `Tenant` + `ErpSetting` + `User` role `admin`.
- `Tenant.slug` definitivo na criação; `ErpSetting.siteSubdomain` espelha.
- **`siteActive: false`** — vitrine desligada até o dono activar em `/site`.
- **`Tenant.active: true`** (sem toggle no formulário).
- Confirmação: resumo (nome, slug, URL, e-mail) + senha **uma vez** (sessionStorage, chave `movix.platform.tenantCreated`); nunca reexibida depois.

## Dois caminhos de subdomínio (ADR-0004)

1. **Plataforma (`super_admin`):** slug definido na criação — imediato em `Tenant.slug` + espelho.
2. **Loja (`admin` em `/site`):** dono edita/confirma subdomínio ao publicar site (`PUT /api/erp-setting`).

## Implementação (código)

- API: `src/app/api/platform/tenants/route.ts`
- UI: `src/app/(platform)/plataforma/lojas/**`
- Tipos: `src/lib/platform/tenantTypes.ts`
- URL pública: `storePublicUrl` / `storePublicHost` (`src/lib/storefront/publicUrl.ts`)

## Testes

- API: `tests/api/platform-tenants.test.ts` (`RUN_DB_TESTS=true`, 7 casos).
- E2E: `e2e/platform-onboarding.spec.ts`, `e2e/platform-access-denied.spec.ts`, setup `e2e/super-admin.setup.ts`.

## Fora de escopo (follow-ups)

- Edição/suspensão de loja, billing, impersonação, signup público.
