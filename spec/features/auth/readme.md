# Feature: Auth

Ver tambem: [Ciberseguranca](../security/readme.md) e [Seed de dev e validacao](../dev-seed-and-validation/readme.md).

## Endpoints

- `GET|POST /api/auth/[...nextauth]` - handlers NextAuth.
- `POST /api/auth/register` - cria utilizador; **admin-only**.

## Body - `POST /api/auth/register`

```ts
{
  email: string,
  password: string,
  name?: string,
  role: "admin" | "vendedor" | "financeiro" | "producao" | "read_only",
  lgpdConsentVersion: string
}
```

Resposta: `201` com payload sem campos sensiveis.

## Erros

- `UNAUTHENTICATED` / `FORBIDDEN` - sem sessao ou sem papel admin.
- `VALIDATION_ERROR` - payload invalido ou sem aceite LGPD.
- `CONFLICT` - email ja cadastrado.
- `RATE_LIMITED` - login persistente por IP+identidade com lockout temporario; `POST /api/auth/register` (5/10 min por IP); outras regras globais em [security](../security/readme.md).

## CSRF

- Mutacoes da mesma origem seguem politica `SameSite=Lax` no escopo browser atual.

## Sessao e revogacao

- Claims sensiveis da sessao sao sempre derivados do servidor.
- Logout invalida a sessao tambem server-side.
- Mudanca de senha, papel ou estado administrativo invalida sessoes ativas relacionadas.

## UI

- `/login` — pública.
- `/cadastro` — **removida** (0623); criação via admin (`POST /api/auth/register`).
- `/configuracoes/usuarios`, `/configuracoes/usuarios/novo`, `/configuracoes/usuarios/[id]` — admin-only.
- `/configuracoes/auditoria` — admin-only.

## Roles (single-tenant)

`admin`, `vendedor`, `financeiro`, `producao`, `read_only`.

## Endpoints adicionais (0629)

- `GET /api/users` — listagem admin.
- `GET /api/users/[id]` — detalhe admin.
- `PATCH /api/users/[id]` — `{ name?, role?, isActive? }`.
- `POST /api/users/[id]/reset-password` — `{ password }`.
- `GET /api/audit-logs` — consulta audit log (admin).
