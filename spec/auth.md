# Auth

## Modelo

- Tabela `users` (`User`): `id`, `email` unico, `passwordHash` (bcrypt), `name?`, `role`, `tenantId?`, metadados de consentimento LGPD e timestamps.
- A sessao pode continuar baseada em JWT para transporte, mas os atributos sensiveis da identidade sao derivados do servidor.
- Logout e revogacao precisam de invalidacao server-side para impedir reutilizacao de sessao revogada.

### Multitenant (cycle 0614 — ADR-0003)

- **Dois níveis de identidade:** `super_admin` (plataforma, `tenantId = null`, cross-tenant auditado) acima de `admin` (dono da loja), `sales`, `finance`, `read_only`, `authenticated` (papéis dentro da loja).
- `User.tenantId` vincula o usuário a **uma** loja. Sessão (callbacks `jwt`/`session`) expõe `session.user.tenantId`.
- `withRole` resolve o tenant da sessão e injeta um Prisma Client **escopado** (`forTenant`); rota de loja sem tenant → 403.
- Rotas de **plataforma** (`/api/platform/**`) usam `withSuperAdmin` (exige `super_admin`; não exige tenant; acesso auditado via `logSecurityWarn`).
- Criação de usuário (`/api/auth/register`, `/api/sellers`) vincula o novo usuário ao tenant do admin criador; listagens de usuários são escopadas ao tenant.

## Área de plataforma (cycle 0617)

- Rotas **`/plataforma/**`** exclusivas de **`super_admin`** (UI separada do ERP).
- Middleware: sessão autenticada com role ≠ `super_admin` → **404** (anti-enumeração).
- Layout `(platform)`: verificação server-side; `notFound()` se não for `super_admin`.
- **Pós-login:** `super_admin` sem `returnTo` → **`/plataforma/lojas`**.
- Onboarding de lojas: ver [Platform onboarding](features/platform-onboarding/readme.md).

## Fluxo de login

1. `/login` continua publico e usa `signIn("credentials", ...)`.
2. `authorize` em `src/lib/auth.ts`:
   - valida `email` e `password`;
   - aplica rate limit e lockout temporario;
   - verifica credenciais contra o armazenamento canonico;
   - devolve apenas a identidade permitida pelo servidor.
3. Callback `jwt` injeta apenas claims derivadas do servidor.
4. Callback `session` expoe `session.user.id`, `role`, `email` e demais campos permitidos.
5. Middleware:
   - mantem rotas publicas explicitamente allowlisted;
   - exige sessao para o restante;
   - devolve `401 UNAUTHENTICATED` nas APIs quando a sessao nao e valida;
   - exige papel adequado nas rotas administrativas;
   - bloqueia `/plataforma/**` para não-`super_admin` (404).

## Papeis (matriz efetiva)

| Rota / API | admin | authenticated | public | Notas |
|------------|:-----:|:-------------:|:------:|-------|
| `/api/auth/[...nextauth]` | ✅ | ✅ | ✅ | Core NextAuth |
| `POST /api/auth/register` | ✅ | ❌ | ❌ | Admin-only; exige aceite LGPD |
| CRUD de dominios | ✅ | ✅ | ❌ | Sempre com verificacao de role e tenant quando aplicavel |
| `/configuracoes**` | ✅ | ❌ | ❌ | Redireciona nao-admin nas paginas; APIs retornam 403 ou 404 conforme anti-enumeracao |
| `/plataforma/**` | ❌ | ❌ | ❌ | Apenas `super_admin`; staff recebe 404 |
| rotas publicas declaradas | ✅ | ✅ | ✅ | `/login`, `/cadastro`, `/politica-privacidade` e equivalentes |

## Criacao de utilizadores (admin-only)

- Self-signup continua desligado por padrao quando a flag publica estiver `false`.
- O fluxo oficial de criacao de usuarios continua admin-only.
- O form exige aceite LGPD quando aplicavel.

## Rate limit, lockout e revogacao

- Login usa limite persistente por IP + identidade.
- Apos excesso de falhas, a conta ou combinacao protegida entra em bloqueio temporario.
- `POST /api/auth/register` e mutacoes sensiveis seguem limites adicionais definidos em `spec/features/security/readme.md`.
- Troca de senha, desativacao de utilizador, mudanca de role e logout administrativo devem invalidar sessoes ativas relacionadas.

## Logout

- `signOut({ callbackUrl: "/login" })` continua a experiencia de UI esperada.
- O encerramento de sessao precisa remover ou invalidar o estado tambem no servidor.
- Sessao expirada ou revogada leva o cliente autenticado de volta ao login sem expor detalhe do mecanismo interno.
