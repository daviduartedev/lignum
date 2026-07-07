# Matriz de autorizacao

Matriz canonica de auditoria para revisar role e scope check por rota.

## RBAC Lignum (cycle 0629 — vigente)

Single-tenant (ADR-0006). **Sem tenant isolation.** Escopo por **papel** + `ownerUserId` onde aplicável + singleton `ErpSetting`.

### Grupos (`@/lib/apiRoles`)

| Constante | Papéis |
|-----------|--------|
| `allStaffReadRoles` | admin, vendedor, financeiro, producao, read_only |
| `commercialWriteRoles` | admin, vendedor |
| `financeWriteRoles` | admin, financeiro |
| `productionWriteRoles` | admin, producao |
| `staffPreferencesWriteRoles` | admin, vendedor, financeiro, producao |
| `adminOnlyRoles` | admin |

### Matriz rota-a-rota

| Rota | GET | Mutações | Scope | Anti-enum | Notas |
|------|-----|----------|-------|-----------|-------|
| `/api/auth/[...nextauth]` | público parcial | público parcial | — | — | signIn/signOut |
| `POST /api/auth/register` | — | admin | — | 403 | rate limit IP |
| `/api/users`, `/api/users/[id]` | admin | admin PATCH | — | 403 | sem `passwordHash` |
| `POST /api/users/[id]/reset-password` | — | admin | — | 403 | revoga sessão |
| `/api/audit-logs` | admin | — | — | 403 | paginado |
| `/api/clients/**` | allStaffRead | commercialWrite | — | 404 IDOR | |
| `/api/leads/**` | allStaffRead | commercialWrite | — | 404 | |
| `/api/quotes/**`, `/api/body-models/**` | allStaffRead | commercialWrite | — | 404 | convert → OP |
| `/api/production-orders/**` | allStaffRead | productionWrite | — | 404 | start/complete/cancel |
| `/api/materials/**`, `/api/stock-movements/**` | allStaffRead | productionWrite | — | 404 | |
| `/api/used-bodies/**` GET | allStaffRead | — | — | 404 | |
| `/api/used-bodies/**` POST/PUT | — | commercialWrite | — | 404 | status `em_reforma` → productionWrite |
| `/api/used-bodies/[id]` DELETE | — | admin | — | 404 | |
| `/api/employees/**` | allStaffRead | admin (mutations) | — | 404 | |
| `/api/payables/**` | allStaffRead | financeWrite | — | 404 | |
| `/api/finance/dispatch-notifications` | — | financeWrite | — | 403 | |
| `/api/erp-setting` | allStaffRead | PUT admin | singleton id=1 | 403 | audit PUT |
| `/api/document-lookup` POST | — | commercialWrite | — | — | CNPJ only |
| `/api/document-lookup/usage` | admin | — | — | 403 | |
| `/api/user-notifications/**` | allStaffRead | staffPreferencesWrite / admin | ownerUserId | 404 | |
| `/api/user/inbox-preferences` | allStaffRead | staffPreferencesWrite | session.user.id | 401 | |
| `/api/inbox/summary` | allStaffRead | — | — | — | materialLowStock |
| `/api/upload` POST | — | commercialWrite | — | — | fotos carrocerias |
| `/api/suppliers/**` | allStaffRead | commercialWrite | — | 404 | |

**Removido (0720):** `/api/vehicles/**`, `/api/service-orders/**`, `/api/sales/**`, `/api/contracts/**`, `/api/evaluations/**`, `/api/warranties/**`, `/api/promissory-notes/**`, `/api/senatran/**`, `/api/dashboard/summary`, `/api/inbox/stock-attention`, `/api/sellers`.

**Evidência:** `tests/authorization.test.ts`, `e2e/auth-rbac.spec.ts`, `e2e/producao-lignum.spec.ts`.

### Regras gerais (0629)

- Toda rota privada declara autenticação via `withRole`.
- `403` quando rota existe e papel não permite; `404` para IDOR/recurso inexistente quando anti-enumeração.
- Utilizador `isActive = false` → `401` em APIs; login bloqueado.

---

## Single-tenant base (cycle 0623 — ADR-0006)

- Rotas removidas: `/api/platform/**`, storefront, `/cadastro`, `/fipe`, `/giro`, `/site`.
- **`/api/auth/register`:** admin-only.
- **`/api/leads`:** staff autenticado.

---

## [Histórico] Matriz 0516 / multitenant

> **Superseded** por ADR-0006 e matriz 0629 acima. Mantido apenas para rastreabilidade.

<details>
<summary>Matriz 0516-security-hardening e multitenant 0614 (colapsado)</summary>

| Rota | Recurso | Autenticacao | Roles permitidas | Scope check | Anti-enumeracao | Observacoes |
|------|---------|--------------|------------------|-------------|-----------------|-------------|
| `/api/auth/[...nextauth]` | sessao | parcial | publico signin/signout | — | nao | |
| `POST /api/auth/register` | usuario | sim | admin | — | 403 | |
| `/api/user-notifications` | notificacao | sim | staff | ownerUserId | 404 | |
| `/api/erp-setting` | ERP | sim | GET staff, PUT admin | singleton | 403 | |
| `/api/senatran/usage` | SENATRAN | sim | admin | — | 403 | |

Multitenant 0614 (`Tenant`, `forTenant`, `super_admin`) removido no cycle 0623.

</details>
