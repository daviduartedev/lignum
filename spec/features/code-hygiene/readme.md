# Feature: Code hygiene

Esta feature canonica cobre limpeza interna com comportamento preservado. O objetivo e reduzir risco operacional e tornar o codigo mais auditavel sem mudar UX, navegacao nem regra de negocio.

## Escopo permitido

- Remover `try/catch` generico que engole erro ou perde contexto importante.
- Resolver `TODO` e `FIXME` antigos quando representarem risco real ou ruido operacional.
- Eliminar codigo morto, imports nao usados, valores magicos hardcoded e duplicacao obvia em areas tocadas.
- Melhorar nomes, extrair pequenas funcoes e remover camadas desnecessarias quando isso simplificar revisao de seguranca ou teste.

## Limites

- Nao refatorar UI por estetica.
- Nao alterar fluxo funcional percebido pelo usuario.
- Nao fazer refactor estrutural amplo sem relacao direta com finding de seguranca ou manutencao imediata.
- O que nao for de baixo impacto entra em backlog, nao no merge do cycle.

## Artefatos esperados

- Checklist executavel em `cycles/.../tasks.md`.
- Follow-ups fora de escopo em `spec/features/code-hygiene/backlog.md`.
- Testes de regressao nas areas alteradas quando a limpeza tocar fluxo compartilhado.

## Relacao com seguranca

Code hygiene e complementar a [Ciberseguranca](../security/readme.md):

- seguranca fecha risco observavel e de superficie;
- code hygiene remove fragilidades internas que aumentam a chance de regressao, mascaram erro ou dificultam auditoria.
