# Seguranca — checklist operacional para ciclos

Hub de seguranca para agentes e revisores em ciclos de desenvolvimento. **Nao substitui** os documentos granulares em `spec/security/*`; referencia-os quando aplicavel.

## Quando consultar este documento

Obrigatorio em todo cycle que tocar:

- rotas de API ou Server Actions;
- autenticacao, sessao ou permissoes;
- dados privados, PII ou multi-tenant;
- banco com escopo por usuario/recurso;
- logs, erros ou observabilidade.

## Checklist pre-implementacao

- [ ] Ler [`features/security/readme.md`](features/security/readme.md) para estado canonico de seguranca.
- [ ] Ler [`security/authorization-matrix.md`](security/authorization-matrix.md) para rotas afetadas.
- [ ] Se dados pessoais (CPF, telefone, email, endereco, documentos, pagamentos): ler [`security/lgpd.md`](security/lgpd.md).
- [ ] Se headers/CORS/cookies: ler [`security/headers.md`](security/headers.md).
- [ ] Se dependencias/CVEs: ler [`security/dependencies.md`](security/dependencies.md).
- [ ] Se pentest manual necessario: ler [`security/manual-pentest.md`](security/manual-pentest.md).

## Checklist de implementacao

### Autenticacao e autorizacao

- [ ] Rotas privadas exigem sessao valida (401 se ausente/expirada/revogada).
- [ ] Autorizacao por role verificada server-side (`withRole`, middleware ou equivalente).
- [ ] Escopo por owner/recurso aplicado em rotas com `id`, filtros ou listagens.
- [ ] Anti-IDOR: recurso de outro owner retorna 404 quando reduz enumeracao.
- [ ] Nao confiar em `user_id`, `role`, `is_admin`, `tenant_id`, `owner_id`, `status`, `amount`, timestamps ou campos sensiveis vindos do client.

### Validacao de entrada

- [ ] Payload validado com schema estrito (Zod ou equivalente).
- [ ] Allowlist de campos; protecao contra mass assignment.
- [ ] Filtros e ordenacao restritos a enums/campos previstos.
- [ ] URLs perigosas (`javascript:`, `data:`, `file://`) rejeitadas.
- [ ] Body size limitado antes da logica de negocio.

### Multi-tenant e isolamento

- [ ] Estado atual: scoping por owner/recurso + matriz de autorizacao (nao ha `tenant_id` global ainda).
- [ ] Novas areas multi-tenant: considerar `tenant_id` e RLS como padrao recomendado futuro.
- [ ] Listagens e queries escopadas; sem vazamento cross-owner.

### Erros e logs

- [ ] Erros de producao genericos em PT-BR, com `correlationId` quando aplicavel.
- [ ] Sem stack, nome de tabela/coluna ou detalhe interno na resposta.
- [ ] Logs com redacao de PII, tokens e secrets ([`security/observability.md`](security/observability.md)).

### Testes de seguranca

- [ ] Testes de acesso negado (401/403/404 conforme politica).
- [ ] Testes anti-IDOR / cross-owner quando aplicavel.
- [ ] Regressao para findings criticos/altos corrigidos no cycle.
- [ ] `npm run test:security` passa (ou falha documentada como preexistente).

## Checklist LGPD (quando aplicavel)

Aplicar quando o cycle tocar clientes, usuarios, documentos, logs, CPF, telefone, email, endereco, atendimentos ou pagamentos:

- [ ] Minimizar coleta e exposicao de dados pessoais.
- [ ] Nao logar PII em texto claro.
- [ ] Consentimento LGPD respeitado em cadastros quando exigido.
- [ ] Segregacao entre owners/tenants preservada.

## Documentos de referencia

| Topico | Documento |
|--------|-----------|
| Feature transversal | [`features/security/readme.md`](features/security/readme.md) |
| Auth e sessao | [`auth.md`](auth.md) |
| Contrato de API | [`api-contract.md`](api-contract.md) |
| Matriz de autorizacao | [`security/authorization-matrix.md`](security/authorization-matrix.md) |
| LGPD | [`security/lgpd.md`](security/lgpd.md) |
| Headers e CORS | [`security/headers.md`](security/headers.md) |
| Pentest manual | [`security/manual-pentest.md`](security/manual-pentest.md) |
| Dependencias/CVEs | [`security/dependencies.md`](security/dependencies.md) |
| Excecoes de dependencia | [`security/dependencies-exceptions.md`](security/dependencies-exceptions.md) |
| Protecao de borda | [`security/edge-protection.md`](security/edge-protection.md) |
| Findings externos | [`security/external-scanner-findings.md`](security/external-scanner-findings.md) |
| Observabilidade | [`security/observability.md`](security/observability.md) |

## Upload de ficheiros (veículos — quando activo)

- Auth staff obrigatoria (`withRole(staffRoles)`).
- Whitelist MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`; extensao coerente e magic bytes.
- Limite por ficheiro (1 MiB) e por pedido (`API_BODY_SIZE_LIMIT_BYTES`); max. 20 ficheiros.
- Sanitizacao de nome; rejeitar null bytes, path traversal (`../`) e extensoes perigosas.
- Armazenamento exclusivamente Vercel Blob; proibido escrever em `/tmp` ou `public/` para uploads user-generated.
- Activacao gated: `ENABLE_SERVER_UPLOADS` + `UPLOAD_SECURITY_CHECKLIST_CONFIRMED` + `BLOB_READ_WRITE_TOKEN`.
- Testes: `tests/api/upload.test.ts`, `tests/security.test.ts` (`npm run test:security`).

## Fora de escopo deste checklist

- Substituir revisao humana em decisoes de aceite de risco.
- Exigir WAF/TLS em todo cycle (ver [`security/edge-protection.md`](security/edge-protection.md)).
- Prescrever refatoracao retroativa de tenant_id/RLS em codigo legado.
