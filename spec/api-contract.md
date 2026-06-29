# API contract

Todas as rotas em `src/app/api/**/route.ts` seguem este contrato.

## Envelope de resposta

### Sucesso

```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "pageSize": 10, "total": 42, "totalPages": 5 }
}
```

- `data`: objeto ou array.
- `meta`: apenas para respostas paginadas.

### Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ha campos com valores invalidos. Revise o formulario.",
    "details": { "campo": ["Mensagem"] },
    "correlationId": "req_123"
  }
}
```

- `code`: slug estavel.
- `message`: PT-BR, pronta para uso pela UI.
- `details`: opcional e restrito a validacao.
- `correlationId`: obrigatorio em erros inesperados e recomendado nos demais fluxos protegidos.

## Regras de exposicao

- Em producao, erro interno retorna payload generico sem stack, nome de tabela, coluna, query ou detalhe de implementacao.
- `404` pode substituir `403` quando isso reduzir enumeracao de recurso.
- `429` deve incluir `Retry-After` quando houver janela conhecida.
- Respostas de API controladas pela aplicacao devem carregar os headers de seguranca canonicos definidos em `spec/security/headers.md`, incluindo respostas de erro e redirects quando emitidos pelo middleware/app.

## Tabela de codigos

| `code` | HTTP | Quando | Mensagem padrao |
|--------|:----:|--------|-----------------|
| `UNAUTHENTICATED` | 401 | Sessao ausente, expirada ou revogada | "Sessao expirada. Faca login novamente." |
| `FORBIDDEN` | 403 | Sessao valida sem permissao suficiente quando nao houver anti-enumeracao | "Voce nao tem permissao para executar esta acao." |
| `NOT_FOUND` | 404 | Recurso inexistente ou ocultado por anti-enumeracao | "Registro nao encontrado." |
| `BAD_REQUEST` | 400 | Parametro malformado | "Requisicao invalida." |
| `VALIDATION_ERROR` | 422 | Body, filtro, ordenacao ou query fora do schema | "Ha campos com valores invalidos. Revise o formulario." |
| `CONFLICT` | 409 | Violacao de unicidade ou regra de negocio | "Ja existe um registro com estes dados." |
| `RATE_LIMITED` | 429 | Excedeu limite configurado | "Muitas tentativas. Tente novamente em alguns minutos." |
| `INTERNAL_ERROR` | 500 | Falha nao tratada | "Erro inesperado no servidor. Tente novamente." |

## Paginacao e filtros

- Query padrao: `?page=1&pageSize=10`.
- `page` minimo 1; `pageSize` clamp em `[1, 100]`.
- Listagens sem pagina obrigatoria, como `?all=1`, ficam sujeitas a rate limit mais estrito.
- Filtros e ordenacao aceitam apenas allowlists documentadas por recurso.

## Parametros de rota

- `[id]` e inteiro positivo.
- `documentId` pode existir no schema legado, mas nao e identificador roteavel.

## Convencoes por verbo

- `GET /api/<recurso>`: lista paginada e filtrada.
- `GET /api/<recurso>/[id]`: busca por id com scoping de auth e tenant quando aplicavel.
- `POST /api/<recurso>`: cria e retorna `201`.
- `PUT /api/<recurso>/[id]`: atualiza e retorna `200`.
- `DELETE /api/<recurso>/[id]`: remove e retorna `200` com `data: { id }` ou equivalente.

## Upload

`POST /api/upload` permanece desativado por backend ate cumprir o checklist de seguranca da reativacao. Nenhuma flag apenas client-side e suficiente para considerar esse endpoint bloqueado.

## Contratos — consulta cadastral CNPJ (cycle 0706)

Detalhe de feature: [document-lookup](features/document-lookup/readme.md).

### `POST /api/document-lookup`

- Auth: `commercialWrite` (`admin`, `vendedor`).
- Body:

```ts
{
  document: string;       // CPF ou CNPJ (máscara aceite)
  context?: "client" | "supplier"; // default "client"
}
```

- **CPF (11 dígitos):** `400 BAD_REQUEST`, `details.code: DOCUMENT_LOOKUP_CPF_NOT_SUPPORTED` — sem chamada externa.
- **CNPJ inválido:** `400`, `details.code: DOCUMENT_INVALID`.
- Cache hit em memória → `200`, `data.cached: true`, sem novo custo.
- Miss → adapter (`DOCUMENT_LOOKUP_PROVIDER`: `mock` | `brasilapi` | `http`); persiste `DocumentLookupAudit`; telemetria `document_lookup_*` (sem CNPJ em claro).
- Rate limit: 5/min por utilizador, 1/min por documento (`429 RATE_LIMITED`).

**Response (200) — DTO normalizado para autofill (sem snapshot bruto):**

```ts
{
  cached: boolean;
  personType: "PJ";
  fullName: string;
  tradeName?: string;
  registrationStatus?: string;
  email?: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  zipCode?: string;
  state?: string;
  address?: string;
}
```

### `GET /api/document-lookup/usage`

- Auth: **`admin`** apenas.
- Agregação de custo (`DocumentLookupAudit.cost`) no **mês civil** (fuso `America/Sao_Paulo`).

## Contratos — PDF preenchido (cycle 0614)

### `GET /api/contracts/[id]/pdf`

- Auth: `withRole(staffRoles)` (login obrigatório).
- `[id]` inteiro positivo (`400 BAD_REQUEST` se malformado).
- Carga **tenant-scoped** via `ctx.db` (`findFirst`): contrato de outro tenant → `404` (sem IDOR). Emissor lido de `ErpSetting`.
- Sucesso `200`: corpo binário `application/pdf` (não envelope JSON), `Content-Disposition: attachment; filename="contrato-<id>.pdf"`, `Cache-Control: private, no-store`, headers de segurança canônicos.
- Sem persistência (PDF on-demand neste ciclo).

## Plataforma — gestão de lojas (super_admin)

Cycle `0617`. Detalhe de UX em [platform-onboarding](features/platform-onboarding/readme.md).

### `GET /api/platform/tenants`

- Auth: `withSuperAdmin`.
- Query: `page`, `pageSize` (contrato global de paginação), `q` opcional (filtra `name` ou `slug`, case-insensitive).
- Ordenação: `createdAt desc`.
- Resposta paginada (`meta` padrão).
- Item: `id`, `name`, `slug`, `active`, `createdAt` (ISO), `_count.users`, `_count.vehicles`, `siteActive`, `publicUrl` (derivado de `storePublicUrl(slug)`; null se sem slug).

### `POST /api/platform/tenants`

- Auth: `withSuperAdmin`.
- Body:

```ts
{
  name: string;           // min 2
  slug?: string;          // opcional; deriva do name
  ownerEmail: string;
  ownerPassword: string;  // min 8
  ownerName?: string;
  siteAddress?: string;    // max 2000, sem HTML
}
```

- Cria `Tenant` + `ErpSetting` (`siteStoreName`, `siteSubdomain`, `siteAddress`, **`siteActive: false`**) + `User` role `admin`.
- Resposta `201`: `{ tenant, owner, publicUrl }`.
- Erros: `CONFLICT` (slug ou e-mail duplicado), `VALIDATION_ERROR`, `FORBIDDEN` (não-super-admin).
