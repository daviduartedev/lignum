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
  role: Role,
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
- `/cadastro` — **removida** (0623); criação de utilizadores via admin (`POST /api/auth/register`) — cycle 0629.
- `/configuracoes/usuarios` e `/configuracoes/usuarios/novo` — admin-only.

## Roles (single-tenant)

`admin`, `sales`, `finance`, `read_only`, `authenticated`, `public`. Sem `super_admin`.
