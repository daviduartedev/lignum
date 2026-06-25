# Feature: Ciberseguranca

Comportamento canonico de seguranca da API e da aplicacao. Ciclos de referencia: `cycles/Q2-2026/0418-ciberseguranca/` e `cycles/Q22026/0516-security-hardening/`.

## P0 fechado neste cycle

- Auditoria do repositorio inteiro com foco em rotas, auth, middleware, logs, envs, CI e upload.
- Secrets externalizados; historico Git varrido para vazamento; rotacao documentada por secret encontrado.
- Rate limit persistente, lockout temporario apos excesso de falhas e `Retry-After` em respostas `429`.
- Sessao endurecida: atributos sensiveis derivados do servidor, logout com invalidacao server-side e revogacao de sessao quando aplicavel.
- Headers de seguranca e CORS estrito por ambiente.
- Validacao de entrada em 100% das rotas, incluindo filtros, listagens e ordenacao.
- Tenant isolation e anti-IDOR com matriz canonica de autorizacao.
- Logging estruturado com redacao automatica de PII, tokens e secrets.
- Erros de producao com payload generico e `correlationId`.
- `POST /api/upload` mantido desativado por backend e endurecido para futura reativacao.
- Suite automatizada obrigatoria: lint, typecheck, testes, `test:security`, audit, build e smoke Playwright dos fluxos priorizados.

## Rate limits e lockout

- **Armazenamento:** Redis persistente em producao e preview quando a infraestrutura estiver em uso real; dev local pode usar fallback restrito e explicitamente documentado.
- **Login:** limite persistente por IP + identidade, com bloqueio temporario apos N tentativas falhadas na janela configurada.
- **`POST /api/auth/register`:** 5 requisicoes / 10 minutos / IP.
- **Mutacoes REST em `/api/*`:** 30 requisicoes / minuto / IP + rota.
- **Listagens sem pagina obrigatoria (`?all=1` ou equivalente):** 10 requisicoes / minuto / IP + utilizador autenticado.
- **Resposta:** `429 RATE_LIMITED`, mensagem neutra em PT-BR e header `Retry-After`.

## Sessao, auth e revogacao

- `AUTH_SECRET` e secrets equivalentes devem vir apenas de ambiente.
- Callbacks `jwt` e `session` nao podem copiar `role`, `id`, `tenantId` ou claims sensiveis do payload do cliente.
- Logout invalida a sessao no servidor, nao apenas no cliente.
- Password reset, desativacao de utilizador, mudanca de role e acao administrativa equivalente devem invalidar sessoes existentes.
- Sessao expirada ou revogada devolve `401 UNAUTHENTICATED` sem detalhe interno.

## Autorizacao e tenant isolation

- Todo Route Handler deve ter verificacao explicita de papel e, quando aplicavel, de tenant.
- Rotas com `id`, `tenantId`, filtros ou listagens devem provar scoping correto.
- Quando a resposta `404` reduzir enumeracao de recurso, ela tem precedencia sobre `403`.
- A matriz canonica obrigatoria fica em [`../../security/authorization-matrix.md`](../../security/authorization-matrix.md).

## Entrada, validacao e upload

- Toda rota usa schema explicito com allowlist de campos.
- Filtros e ordenacao aceitam apenas enums e campos predefinidos.
- Texto simples continua sem HTML rico; URLs com `javascript:`, `data:` e `file://` sao rejeitadas.
- Corpos oversized sao rejeitados antes da logica de negocio.
- `POST /api/upload` fica bloqueado por backend ate cumprir checklist de seguranca de reativacao.

## Headers, cookies e CORS

- CORS same-origin por padrao com allowlist explicita por ambiente em `ALLOWED_ORIGINS`.
- Sem `*` e sem reflexao dinamica do header `Origin`.
- Cookies e headers focam producao e preview; excecoes de dev ficam documentadas em [`../../security/headers.md`](../../security/headers.md).
- Headers obrigatorios incluem CSP pragmatica, HSTS quando aplicavel, anti-frame, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e reducao de fingerprinting.
- Headers devem cobrir paginas HTML, APIs, redirects e erros controlados pela aplicacao, com `/login` como rota publica critica para reteste externo.

## Findings externos, TLS e borda

- Findings de scanner externo seguem [`../../security/external-scanner-findings.md`](../../security/external-scanner-findings.md).
- Achados devem ser classificados como `corrigido-no-app`, `dependencia-plataforma`, `falso-positivo` ou `risco-aceito`.
- TLS, WAF, CDN, DNS, bot protection e reverse proxy sao tratados como camada de borda. Quando a correcao nao for controlavel pelo app Next.js, a dependencia deve ficar documentada com dono, impacto e criterio de reteste.
- WAF/firewall/bot protection segue a politica em [`../../security/edge-protection.md`](../../security/edge-protection.md) e e recomendacao canonica para producao e preview.
- Ausencia de WAF dedicado pode ser aceita temporariamente apenas com controles compensatorios documentados, dono e data de revisao.
- Findings de conectividade de scanner, como Nikto sem conexao, devem separar impacto real para usuario final de comportamento especifico do scanner ou da borda.

## Pentest manual e observabilidade

- Scanners automatizados nao substituem validacao manual de IDOR, RBAC, tenant isolation e abuso de fluxo.
- O checklist canonico fica em [`../../security/manual-pentest.md`](../../security/manual-pentest.md).
- Sinais minimos de seguranca ficam em [`../../security/observability.md`](../../security/observability.md) e incluem picos de `401`, `403`, `404`, `429`, `500`, excesso de login falho, bloqueios de rate limit, tentativas cross-tenant e eventos de logout/revogacao.
- Evidencias operacionais devem manter redacao de PII/secrets conforme [`../../security/lgpd.md`](../../security/lgpd.md).

## Erros, logs e LGPD

- Em producao, erros inesperados retornam payload generico com `correlationId`, sem stack nem detalhes de implementacao.
- Respostas nunca incluem `passwordHash`, tokens, secrets ou dados pessoais desnecessarios ao fluxo.
- Logs estruturados aplicam redacao automatica a PII, secrets e identificadores sensiveis antes de sair para observabilidade externa.
- Regras complementares de minimizacao, retencao e segregacao ficam em [`../../security/lgpd.md`](../../security/lgpd.md).

## Dependencias e CI

- `npm audit --audit-level=high` bloqueia merge para `high` e `critical`.
- `moderate` exige registro com prazo de mitigacao em [`../../security/dependencies.md`](../../security/dependencies.md).
- Excecoes de upgrade precisam de justificativa e data de revisao em [`../../security/dependencies-exceptions.md`](../../security/dependencies-exceptions.md).
- `gitleaks` ou equivalente roda no pre-commit e no CI.

## Descobertas controladas

- Upstash Redis esta em uso real para rate limit persistente com fallback local.
- SENATRAN/Extrato Veicular esta em uso real para consulta por placa/RENAVAM e auditoria.
- Vercel Blob existe como dependencia e helper latente; upload segue bloqueado por backend e por checklist server-side.
- Provedor de email nao foi encontrado em uso real neste cycle.
