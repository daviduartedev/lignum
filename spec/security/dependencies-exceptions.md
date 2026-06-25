# Excecoes de dependencias

Registre aqui excecoes aprovadas quando um upgrade de seguranca nao puder entrar imediatamente sem risco funcional desproporcional.

Cada excecao deve conter:

1. pacote afetado;
2. vulnerabilidade ou advisory;
3. motivo para adiar;
4. mitigacao compensatoria atual;
5. data de revisao obrigatoria.

## Excecoes atuais

| Pacote | Advisory | Motivo | Mitigacao | Revisao |
|--------|----------|--------|-----------|---------|
| `postcss` transitivo em `next` | GHSA-qx2v-qp2m-jg93 | `npm audit` reporta `fixAvailable: false` apos upgrade de `next` para `^15.5.18`. | CSP, texto sem HTML rico e testes de validacao/XSS; revisar quando houver patch transitivo. | 2026-06-16 |
