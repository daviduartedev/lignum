# Padroes de backend

Padroes vigentes derivados do codigo atual. Melhorias futuras aparecem como **recomendado para ciclos futuros**, sem exigir refatoracao retroativa.

## Organizacao de camadas (padrao vigente)

| Camada | Local | Responsabilidade |
|--------|-------|------------------|
| Route handlers | `src/app/api/**/route.ts` | HTTP, auth wrapper, parse de entrada, resposta |
| Services | `src/services/internal/**` | Regras de negocio e orquestracao |
| Lib/utilitarios | `src/lib/**` | Schemas Zod, auth, DB, paginacao, erros, mappers |
| Hooks (client) | `src/hooks/**` | Fetch/cache no cliente via React Query |

**Nao formalizar** controller/service/repository com Prisma isolado neste momento — nao e o padrao adotado hoje.

## Route handlers

- Exportar verbos HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) por arquivo.
- Envolver handlers com `withRole(roles, handler)` para auth + role check.
- Validar entrada com schemas Zod de `@/lib/zodSchemas` ou schema local.
- Retornar envelope canonico via `ok()` / `fail()` de `@/lib/jsonResponse`.
- Erros de validacao via `zodErrorResponse()` de `@/lib/routeUtils`.
- Paginacao via `parsePagination()` e `paginationMeta()`.

## Validacao de entrada

- Sempre `safeParse` antes de usar dados do client.
- Allowlist de campos no schema; rejeitar campos extras quando relevante.
- Query params, filtros e ordenacao com enums/campos previstos.
- Nunca confiar em IDs de owner, role ou status vindos do payload.

## Autorizacao

- Sessao via `auth()`; verificar revogacao com `isSessionRevoked`.
- Roles definidas em `@/lib/apiRoles` (`staffRoles`, etc.).
- Escopo por owner em recursos sensiveis (ex.: notificacoes por `ownerUserId`).
- Preferir `404` sobre `403` quando reduz enumeracao ([`api-contract.md`](api-contract.md)).

## Tratamento de erro

- Erros inesperados: `logSecurityError()` + `fail("INTERNAL_ERROR", 500, { correlationId })`.
- Mensagens user-facing em PT-BR, sem detalhe interno.
- Seguir tabela de codigos em [`api-contract.md`](api-contract.md).

## Acesso a dados

- **Prisma singleton** em `src/lib/db.ts` — sem `forTenant` (removido no cycle 0623).
## Idempotencia e transacoes

- Operacoes multi-step no banco: usar `prisma.$transaction`.
- Endpoints de criacao: considerar duplicidade e retorno consistente.
- **Recomendado futuro:** chaves de idempotencia em mutacoes criticas (pagamentos, confirmacoes).

## Boundaries

- Route handler: fino — parse, auth, delegacao, resposta.
- Service: regra de negocio reutilizavel.
- Lib: utilitarios sem regra de dominio.
- Evitar duplicar regra de negocio entre route e componente.

## Nao confiar no client

- Toda mutacao e leitura sensivel passa pelo servidor.
- Atributos de sessao (`role`, `id`) derivados do servidor, nunca do client.
- Validacao server-side obrigatoria mesmo com validacao no formulario.

## Upload de ficheiros (veículos)

- `POST /api/upload`: `withRole(staffRoles)`, `multipart/form-data` campo `files[]`, limite de corpo `API_BODY_SIZE_LIMIT_BYTES`.
- Desactivado por defeito até `ENABLE_SERVER_UPLOADS=true` **e** `UPLOAD_SECURITY_CHECKLIST_CONFIRMED=true`; resposta 400 com mensagem PT-BR.
- Quando activo: validações P0 em `src/lib/uploadValidation.ts` (MIME whitelist, extensão, magic bytes, tamanho máx. 1 MiB/ficheiro, máx. 20 ficheiros, nome sanitizado); delegação a `uploadFile()` → Vercel Blob (`@vercel/blob`), prefixo `autocore/`, URLs HTTPS públicas.
- **Proibido** persistir uploads user-generated em filesystem local (`public/`, `/tmp`) na Vercel.
- Rotas auxiliares (staff): `GET /api/vehicles/unsplash-photo`, `POST /api/vehicles/suggested-photos` (import Unsplash → Blob).

Variáveis: `BLOB_READ_WRITE_TOKEN`, `ENABLE_SERVER_UPLOADS`, `UPLOAD_SECURITY_CHECKLIST_CONFIRMED` — ver `.env.example`.

## Referencias

- Contrato API: [`api-contract.md`](api-contract.md)
- Auth: [`auth.md`](auth.md)
- Seguranca: [`security.md`](security.md)
- Banco: [`database.md`](database.md)
