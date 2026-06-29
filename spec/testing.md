# Testing strategy

## Estado canonico

- O repositorio passa a exigir testes automatizados como gate normal de merge.
- A validacao manual por `scenarios.feature` continua, mas como camada complementar de smoke e aceitacao.

## Gates obrigatorios antes do merge

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run test:security`
5. `npm audit --audit-level=high`
6. `npm run build`
7. Playwright para os fluxos priorizados do cycle vigente

## Cobertura minima de seguranca

- auth: login, rate limit, lockout, expiracao/revogacao de sessao, conta inactiva;
- autorizacao: RBAC Lignum por grupo (`tests/authorization.test.ts`), anti-IDOR;
- validacao: payloads invalidos, allowlists de filtros e ordenacao, body size, URLs perigosas;
- transporte: headers de seguranca e CORS;
- logging: redacao de PII, tokens e secrets; audit log de acoes sensiveis;
- regressao: um teste por finding critico/alto corrigido no cycle.

## Testes RBAC (cycle 0629)

- `tests/authorization.test.ts` — matriz allow/deny por papel (incluido em `npm run test:security`).
- `e2e/auth-rbac.spec.ts` — smoke login admin/vendedor/financeiro/producao; vendedor bloqueado em `/configuracoes`.

## Processo manual complementar

1. `npm run dev` com `DATABASE_URL` valido.
2. `npm run db:seed` quando o fluxo exigir massa local.
3. Executar os cenarios de `cycles/**/scenarios.feature` mais os smokes definidos em `tasks.md`.
4. Conferir status HTTP, envelope de resposta e mensagens user-facing nas rotas tocadas.
5. Verificar se logs nao expoem dados internos ou pessoais.

## Validacao no Harness

Ao fechar um cycle, `validate-cycle` registra resultados em `validation.md` com a tabela:

| Cenario Gherkin | Evidencia automatizada | Smoke/manual | Status | Observacoes |
|-----------------|------------------------|--------------|--------|-------------|

- Mapear cada cenario de `scenarios.feature` para evidencia concreta.
- Falhas preexistentes (lint/build/test) documentar como baseline; nao corrigir fora do escopo.
- Playwright/E2E obrigatorio quando o cycle tocar fluxo critico de UI, auth, jornada principal ou regressao conhecida — nao em todo medium/large.
- Fluxo completo: [`development-workflow.md`](development-workflow.md) e [`harness.md`](harness.md).

## Fora de cobertura por padrao

- Upload produtivo com Vercel Blob enquanto o endpoint permanecer desativado.
- Testes de carga e performance intensiva.
- Integracoes externas reais pagas quando houver mock contratual suficiente.
