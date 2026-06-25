# Dependencias e vulnerabilidades

Politica canonica para vulnerabilidades em dependencias.

## Gates de merge

- `critical`: bloquear merge.
- `high`: bloquear merge.
- `moderate`: registrar mitigacao com prazo maximo de 30 dias.
- `low` e `info`: registrar quando relevante, sem gate automatico.

## Processo

1. Rodar `npm audit --audit-level=high` no CI.
2. Corrigir primeiro as dependencias diretamente usadas em runtime ou auth.
3. Quando a correcao quebrar funcionalidade, abrir excecao formal em `dependencies-exceptions.md`.
4. Reavaliar excecoes em toda revisao de dependencia ou no prazo documentado.

## Registro minimo por finding

- pacote e versao afetada;
- severidade;
- impacto esperado no produto;
- mitigacao aplicada ou prazo;
- responsavel pela reavaliacao.

## Findings do cycle 0516-security-hardening

| Pacote | Severidade | Status | Mitigacao |
|--------|------------|--------|-----------|
| `next` `<15.5.18` | high | corrigido | Atualizado para `next@^15.5.18`; `npm audit --audit-level=high` deve passar sem high/critical. |
| `postcss` transitivo via `next` | moderate | monitorar | Sem fix disponivel pelo audit apos upgrade do Next; revisar em ate 30 dias ou quando Next publicar dependencia corrigida. |
| `next` / `next-auth` afetados por `postcss` transitivo | moderate | monitorar | Exposicao indireta sem fix disponivel no audit atual; manter CSP e validacao de texto sem HTML. |

Comando executado no cycle: `npm audit --audit-level=high`. Resultado apos upgrade: sem `high`/`critical`; permanecem 3 `moderate` sem fix disponivel.
