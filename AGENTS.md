# AGENTS.md — padrões de código (Lignum)

Guia para **agentes de IA e desenvolvedores** sobre como escrever código neste repositório (Next.js, TypeScript, Prisma, Vitest).

Para **ciclos SDD Harness** (escopo, gates, segurança operacional, commits), use [`.cursor/rules/ai-agent.md`](.cursor/rules/ai-agent.md) e [`spec/harness.md`](spec/harness.md). Este arquivo cobre **estilo e engenharia**; não substitui o Harness.

---

## Code style

- **Funções:** ~4–20 linhas. Se passar disso, extrair helpers com nomes claros.
- **Arquivos:** preferir &lt;500 linhas. Dividir por responsabilidade (service, mapper, schema, route).
- **SRP:** uma responsabilidade por função; um tema principal por módulo.
- **Nomes:** específicos e únicos. Evitar genéricos como `data`, `handler`, `Manager`. Preferir nomes que retornem **poucos hits** no repo (`rg`); em termos de domínio inevitáveis (ex.: `clientId`), seja explícito no prefixo/sufixo.
- **Tipos:** explícitos em contratos de API e domínio. Sem `any` não justificado, sem funções sem tipo de retorno quando não for óbvio. Use `interface` / `type` / Zod infer — não “objetos soltos”.
- **DRY:** extrair lógica compartilhada para `src/lib/*` ou módulo coeso; não copiar blocos.
- **Controle de fluxo:** early return; no máximo **2 níveis** de indentação aninhada.
- **Erros:** mensagens devem incluir o **valor problemático** (ou identificador seguro) e a **forma esperada**. Use os helpers do projeto (`apiErrors`, `jsonResponse`) em rotas; não engolir exceções.

Antes de inventar padrão novo, **copie o equivalente** já existente (route handler + Zod, service layer, mapper).

---

## Comments

- **Preserve** comentários existentes em refactors — carregam intent e proveniência.
- Explique **por quê**, não o quê óbvio do código.
- **JSDoc** em funções exportadas públicas: intent + um exemplo mínimo de uso quando a API não for trivial.
- Referencie **issue / cycle / SHA** quando uma linha existir por bug específico ou restrição upstream.

---

## Tests

- Comando principal: `npm run test` (Vitest).
- **Função nova** com comportamento não trivial → teste unitário ou de integração adequado.
- **Bugfix** → teste de regressão que falhava antes.
- **I/O externo** (API, DB, filesystem): mock com **classes/fakes nomeados** ou módulos dedicados (ex.: `mockProvider`), não stubs anônimos espalhados.
- Testes **F.I.R.S.T.:** rápidos, independentes, repetíveis, auto-validantes, escritos junto com a mudança.

Gates do projeto ao fechar trabalho (ver [`spec/development-workflow.md`](spec/development-workflow.md)):

| Comando | Quando |
|---------|--------|
| `npm run lint` | sempre |
| `npm run typecheck` | sempre |
| `npm run test` | sempre |
| `npm run build` | sempre |
| `npm run test:security` | auth, API, segurança |
| `npm run test:e2e` | fluxo crítico de UI / jornada principal |
| `npm run audit:ci` | dependências alteradas |

Não marcar tarefa concluída sem **evidência** (output dos comandos ou registro no cycle).

---

## Dependencies

- Preferir **injeção** via parâmetro ou construtor em lógica testável; evitar acoplar a globals quando um parâmetro resolve.
- **Libs de terceiros:** usar diretamente onde já é padrão do stack (Next, Prisma, Zod). Para substituir ou isolar comportamento complexo, encapsule atrás de um módulo **deste** repo.
- Nova dependência npm só com **necessidade clara**; `npm run audit:ci` deve passar (nível high).

---

## Structure

- Seguir **App Router**: `src/app/` (pages, layouts, `api/**/route.ts`).
- Lógica de negócio em **`src/lib/**`** (services, mappers, schemas Zod, utilitários).
- Testes em **`tests/`**, espelhando áreas críticas (`tests/api`, `tests/lib`, …).
- Rotas API: validação Zod, autorização `withRole`, respostas via padrão existente — ver exemplos nas rotas irmãs.

Paths previsíveis valem mais que pastas “misc”.

---

## Formatting

- **ESLint** + **Prettier** são a fonte de verdade. Não debater estilo manualmente.
- Antes de concluir: `npm run lint` e `npm run typecheck` sem erros/warnings **novos** introduzidos pela mudança.

Proibido sem justificativa documentada: `@ts-ignore`, `eslint-disable` sem motivo, `try/catch` vazio.

---

## Logging

- **Observabilidade / debug / segurança:** usar [`src/lib/secureLogger`](src/lib/secureLogger.ts) (`logSecurityError`, `logSecurityWarn`, `redactSensitive`). Saída estruturada; **nunca** PII ou segredos em claro.
- **CLI ou mensagens ao usuário final:** texto simples, sem JSON de log.
- Respostas HTTP: sem stack trace em produção; alinhado a [`spec/security.md`](spec/security.md).

---

## Relação com o Harness

| Tema | Onde ler |
|------|----------|
| Escopo de cycle, stages, specs | [`spec/harness.md`](spec/harness.md), [`spec/development-workflow.md`](spec/development-workflow.md) |
| Segurança, LGPD, matriz de papéis | [`.cursor/rules/ai-agent.md`](.cursor/rules/ai-agent.md), [`spec/security.md`](spec/security.md) |
| Estilo, testes, estrutura de código | **este `AGENTS.md`** |

Fora de um cycle aprovado: **não** refatorar o codebase só para cumprir limites de linhas ou renomeação em massa — abra cycle ou registre recomendação.
