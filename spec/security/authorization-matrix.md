# Matriz de autorizacao

Matriz canonica de auditoria para revisar role e scope check por rota.

## Single-tenant (cycle 0623 — ADR-0006)

- **Sem tenant isolation.** Coluna histórica "Tenant check" → **Scope check** (role + `ownerUserId` + singleton).
- **Rotas removidas:** `/api/platform/**`, storefront público, `/cadastro`, `/fipe`, `/giro`, `/site`.
- **`/api/erp-setting`:** singleton `id = 1`; GET staff, PUT admin.
- **`/api/auth/register`:** admin-only; sem auto-cadastro público.
- **`/api/leads`:** staff autenticado (leads internos CRM).
- Evidência: `tests/api/routes.test.ts` (`RUN_DB_TESTS=true`); e2e `navigation.spec.ts`, `smoke.spec.ts`.

> Secções multitenant abaixo são **históricas** (superseded por ADR-0006).

## Regras gerais

- Toda rota deve declarar autenticacao exigida.
- Toda rota com recurso por `id`, `tenantId`, filtro ou listagem deve declarar como faz scoping.
- Quando o objetivo for evitar enumeracao, a resposta para acesso indevido pode ser `404` em vez de `403`.

## Modelo de preenchimento obrigatorio

| Rota | Recurso | Autenticacao | Roles permitidas | Tenant check | Anti-enumeracao | Observacoes |
|------|---------|--------------|------------------|--------------|-----------------|-------------|
| `/api/...` | recurso | sim/nao | admin, ... | como valida | 403 ou 404 | lacunas e follow-ups |

## Cobertura minima

- Auth (`/api/auth/*` e fluxo de sessao).
- Rotas com `id` na URL.
- Rotas com `tenantId` direto ou indireto.
- Listagens filtradas.
- Notificacoes e preferencias por utilizador.
- Configuracoes administrativas e recursos cross-tenant.

## Status do cycle

Este documento deve ser atualizado no cycle de hardening com a matriz preenchida a partir do codigo real e servir como checklist de revisao manual antes do merge.

## Matriz inicial do cycle 0516-security-hardening

| Rota | Recurso | Autenticacao | Roles permitidas | Tenant check | Anti-enumeracao | Observacoes |
|------|---------|--------------|------------------|--------------|-----------------|-------------|
| `/api/auth/[...nextauth]` | sessao | parcial | publico para signin/signout/session | sem tenant modelado | nao | Logout passa a registrar revogacao server-side quando houver sessao. |
| `POST /api/auth/register` | usuario | sim | admin | sem tenant modelado | 403 | Rate limit por IP no middleware. |
| `/api/user-notifications` | notificacao | sim | staff | `ownerUserId` para nao-admin | 404 em recurso alheio | Lista scoped; admin ve todas. |
| `/api/user-notifications/[id]` | notificacao por id | sim | staff | `ownerUserId` para nao-admin | 404 | Anti-IDOR ja aplicado. |
| `/api/user/inbox-preferences` | preferencias do usuario | sim | staff | `session.user.id` | 401 | Escopo sempre no usuario autenticado. |
| `/api/erp-setting` | configuracao ERP | sim | GET staff, PUT admin | singleton sem tenant modelado | 403 | Requer revisao se tenant for introduzido. |
| `/api/senatran/usage` | auditoria SENATRAN | sim | admin | sem tenant modelado | 403 | Agregado administrativo. |
| `/api/upload` | upload latente | sim | staff | sem tenant modelado | nao | Backend bloqueia recurso ate checklist completo. |
| `/api/*/[id]` dominios operacionais | veiculos, clientes, contratos, financeiro, OS | sim | staff/admin conforme rota | sem tenant modelado no schema atual | 404 quando recurso inexiste | IDOR cross-tenant fica pendente ate existir tenant no modelo de dados. |

Nota: o schema Prisma atual nao possui entidade ou coluna `tenant_id`. O cycle aplica scoping por usuario onde o modelo ja existe (`UserNotification`, preferencias e auditoria); isolamento entre tenants precisa de extensao de modelo antes de ser plenamente testavel.

## Multitenant — isolamento implementado (cycle 0614)

> **Supersede a nota acima.** O cycle `0614-multitenant-fundacao` introduziu `Tenant` + `tenantId` e o isolamento cross-tenant, antes pendente.

### Modelo de ameaças

- **Ameaça principal:** IDOR cross-tenant — usuário do tenant A acede/edita/apaga recurso do tenant B (por listagem ou por id).
- **Mitigação (implementada e testada):**
  - Guard central `forTenant(tenantId)` (`src/lib/db.ts`) força `where.tenantId` (leitura/where-ops) e `data.tenantId` (create/createMany/upsert) nos 16 models de negócio. **O tenant da sessão sempre vence** — `{ ...data, tenantId }` impede override pelo caller.
  - `withRole` resolve tenant da sessão e injeta `db` escopado; rota de loja sem tenant → 403.
  - `[id]` GET/PUT/DELETE: id de outro tenant não casa o `where` escopado → **NOT_FOUND** (anti-enumeração).
  - Plataforma (`super_admin`) via `withSuperAdmin`: cross-tenant **intencional e auditado** (`logSecurityWarn`).
- **Evidência:** `tests/tenant-scope.test.ts` + `tests/tenant-isolation.test.ts` (adversarial, sem DB) e `tests/integration/tenant-isolation.int.test.ts` (DB, 2 tenants: A não vê B; anti-IDOR por id). Todos verdes (2026-06-15).
- **Evidência plataforma (0617):** `tests/api/platform-tenants.test.ts` (7 casos, `RUN_DB_TESTS=true`); E2E `e2e/platform-onboarding.spec.ts`, `e2e/platform-access-denied.spec.ts`.
- **Limites/follow-ups:** RLS no Postgres como defesa em profundidade (recomendado); `$queryRaw`/`$executeRaw` fora do guard (nenhum uso em models de negócio).

### Tenant check (atualização das linhas pendentes)

| Rota | Tenant check | Anti-enumeração |
|------|--------------|-----------------|
| `/api/*` domínios de negócio (coleção + `[id]`) | `tenantId` forçado pelo guard (`forTenant`) | 404 em recurso de outro tenant |
| `/api/erp-setting` | `where: { tenantId }` (1:1 por tenant) | 403/escopo por tenant |
| `/api/sellers`, `/api/auth/register` | grava/filtra `tenantId` do admin | 409 em e-mail duplicado |
| `/api/platform/tenants` | `super_admin` cross-tenant auditado | 403 a não-super-admin |
| `/plataforma/**` (páginas) | `super_admin` | 404 a staff de loja |
| `/api/user/inbox-preferences` | `session.user.id` (self) | 401 |
