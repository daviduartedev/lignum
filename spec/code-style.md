# Estilo de codigo

Padroes vigentes para TypeScript/JavaScript neste repositorio.

## Ferramentas

| Ferramenta | Status | Comando |
|------------|--------|---------|
| ESLint | vigente | `npm run lint` |
| TypeScript | vigente | `npm run typecheck` |
| Prettier | **nao instalado** | — |

Formatacao segue ESLint + convencoes do projeto. Prettier pode ser avaliado em cycle futuro; nao instalar sem autorizacao explicita.

## ESLint

- Config: `eslint.config.mjs` (Next.js core-web-vitals + typescript).
- Ignorados: `.next/`, `node_modules/`, `coverage/`, reports de teste.

## TypeScript

- Strict mode conforme `tsconfig.json`.
- Preferir tipos explicitos em boundaries (API, schemas, mappers).
- Evitar `any`; usar `unknown` + narrowing quando necessario.
- Path alias: `@/` → `src/`.

## Organizacao de imports

Ordem sugerida (sem ferramenta automatica):

1. tipos externos (`import type`)
2. dependencias externas
3. aliases `@/`
4. imports relativos

Remover imports nao usados.

## Naming

| Elemento | Convencao |
|----------|-----------|
| Componentes React | PascalCase |
| Hooks | `use` + PascalCase |
| Funcoes/utilitarios | camelCase |
| Constantes | camelCase ou UPPER_SNAKE para env/flags |
| Arquivos de componente | PascalCase ou kebab conforme pasta existente |
| Schemas Zod | `*Schema` suffix |

## Tamanho e estrutura

- Arquivos: manter foco; extrair quando passar de ~300 linhas com responsabilidades misturadas.
- Funcoes: preferir funcoes curtas e nomeadas; evitar aninhamento profundo.
- Comentarios: apenas para logica de negocio nao obvia ou detalhes tecnicos relevantes.
- Evitar codigo morto, abstracoes prematuras e overengineering.

## Convencoes do projeto

- Mensagens user-facing: PT-BR.
- Commits sugeridos em ciclos: Conventional Commits (ingles), ex.: `feat(scope): description`.
- API responses: envelope canonico ([`api-contract.md`](api-contract.md)).
- Validacao: Zod schemas em `@/lib/zodSchemas` ou co-localizados quando especificos.

## Checklist pre-merge

- [ ] `npm run lint` passa
- [ ] `npm run typecheck` passa
- [ ] Sem imports mortos ou codigo comentado desnecessario
- [ ] Naming consistente com arquivos vizinhos

## Referencias

- Backend: [`backend.md`](backend.md)
- Testes: [`testing.md`](testing.md)
