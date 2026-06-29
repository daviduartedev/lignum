# Auth

Single-tenant Lignum (ADR-0006). Sem `Tenant`, `tenantId`, `super_admin` nem `/plataforma/**`.

## Modelo

- Tabela `users` (`User`): `id`, `email` único, `passwordHash` (bcrypt), `name?`, `role`, `isActive`, `sessionRevokedAt?`, metadados LGPD e timestamps.
- Sessão JWT para transporte; claims sensíveis derivadas do servidor (`jwt`/`session` callbacks).
- Logout e revogação invalidam sessão server-side (`sessionRevokedAt`).

## Papéis Lignum (cycle 0629)

| Papel | Descrição |
|-------|-----------|
| `admin` | Acesso total; gestão de utilizadores e auditoria |
| `vendedor` | Comercial: clientes, vendas, contratos, leads, veículos (legado Movix) |
| `financeiro` | Financeiro: payables, promissórias, dispatch financeiro |
| `producao` | Produção: OS (R/W), dashboard, notificações próprias |
| `read_only` | Leitura nas rotas operacionais permitidas; sem mutações |

Grupos RBAC em `@/lib/apiRoles`: `allStaffReadRoles`, `commercialWriteRoles`, `financeWriteRoles`, `productionWriteRoles`, `adminOnlyRoles`. Matriz rota-a-rota: [`security/authorization-matrix.md`](security/authorization-matrix.md).

## Fluxo de login

1. `/login` público; `signIn("credentials", ...)`.
2. `authorize` em `src/lib/auth.ts`:
   - rate limit + lockout por IP + identidade;
   - rejeita credenciais inválidas **ou** `isActive = false` (mensagem genérica, anti-enumeração);
   - regista `login_success` / `login_failure` em `AuditLog` (metadados redigidos).
3. Callbacks `jwt`/`session` expõem `id`, `role`, `email`, `sessionIssuedAt`.
4. Middleware:
   - rotas públicas allowlisted (`/login`, `/politica-privacidade`);
   - exige sessão válida no restante;
   - APIs sem sessão → `401 UNAUTHENTICATED`;
   - `/configuracoes/**` → apenas `admin` (redirect staff para `/`).

## Páginas (middleware)

| Rota | Papéis |
|------|--------|
| `/login`, `/politica-privacidade` | público |
| `/configuracoes/**` | `admin` |
| Demais `(main)/**` | staff autenticado activo (RBAC fino na API) |

Nav (`Sidebar`) filtrada por papel — defesa em profundidade; API é autoritativa.

## Utilizador inactivo

- Login falha com mensagem genérica (mesmo texto que credencial inválida).
- `withRole` devolve `401` se `isActive = false` (consulta server-side).
- Desactivar revoga sessões via `sessionRevokedAt`.

## Criação e gestão de utilizadores

- **Criar:** `POST /api/auth/register` (admin-only) ou UI `/configuracoes/usuarios/novo`.
- **Listar/detalhe:** `GET /api/users`, `GET /api/users/[id]`.
- **Actualizar:** `PATCH /api/users/[id]` — `name?`, `role?`, `isActive?`.
- **Reset senha:** `POST /api/users/[id]/reset-password` — admin define nova senha; revoga sessão.
- **Regras:** não desactivar/rebaixar a si próprio; manter pelo menos um `admin` activo.
- Aceite LGPD na criação (`lgpdConsentVersion`).

Ver também [Feature: Auth](features/auth/readme.md) e [Audit log](features/audit/readme.md).

## Rate limit, lockout e revogação

- Login: limite persistente por IP + identidade; lockout temporário após N falhas.
- `POST /api/auth/register`: 5 req / 10 min / IP.
- Gatilhos de `revokeUserSessions`: desactivação, alteração de `role`, reset de senha pelo admin.

## Logout

- `signOut({ callbackUrl: "/login" })` na UI.
- Sessão expirada ou revogada → login sem expor detalhe interno.
