# Feature: Document lookup (CNPJ cadastral)

Consulta externa de **CNPJ** para pré-preencher cadastro de clientes PJ e fornecedores.

## Endpoints

- `POST /api/document-lookup` — `commercialWrite`; body `{ document, context? }`.
- `GET /api/document-lookup/usage` — **admin**; custo agregado mês civil.

## Provedores (`DOCUMENT_LOOKUP_PROVIDER`)

- `mock` (default dev/testes)
- `brasilapi` — BrasilAPI `/api/cnpj/v1/{cnpj}`
- `http` — fallback configurável (`DOCUMENT_LOOKUP_HTTP_BASE`)

## Comportamento

- **CPF:** rejeitado com `DOCUMENT_LOOKUP_CPF_NOT_SUPPORTED` (sem chamada externa).
- Cache em memória por CNPJ normalizado (`DOCUMENT_LOOKUP_CACHE_TTL_SECONDS`, default 24h).
- Auditoria persistida em `DocumentLookupAudit` (snapshot admin-only).
- Rate limit: 5/min usuário, 1/min documento.

## Autofill (UI)

- Preenche **apenas campos vazios** — não sobrescreve edição manual.
- Mapper: `src/lib/documentLookup/mapper.ts` (BrasilAPI → DTO normalizado).

## LGPD

Ver [`../../security/lgpd.md`](../../security/lgpd.md) — secção cadastro staff.
