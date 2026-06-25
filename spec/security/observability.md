# Observabilidade de seguranca

Este documento define sinais minimos de seguranca para producao e preview.

## Objetivo

Permitir investigacao e resposta a abuso sem expor PII, secrets ou detalhes internos desnecessarios.

## Sinais minimos

- picos de `401`, `403`, `404`, `429` e `500`;
- excesso de login falho por IP ou identidade;
- bloqueios de rate limit;
- tentativas de payload invalido;
- tentativas de acesso cross-tenant;
- eventos de logout e revogacao de sessao;
- erros inesperados com `correlationId`.

## Politica de evidencia

- Evidencias usam `correlationId` sempre que possivel.
- Dados pessoais e secrets devem ser redigidos antes de sair para ferramenta externa.
- Exportacoes para tickets, auditorias ou fornecedores nao podem conter senha, token, cookie, CPF, CNPJ, telefone, email completo, endereco, dados bancarios ou IDs sensiveis sem mascaramento.

## Alertas iniciais recomendados

- Qualquer aumento sustentado de `500` por 5 minutos.
- Aumento de 3x sobre baseline para `401`, `403` ou `404` em 15 minutos.
- Qualquer pico inesperado de `429`.
- Cinco ou mais falhas de login por IP ou identidade em 10 minutos.
- Qualquer tentativa cross-tenant confirmada.
