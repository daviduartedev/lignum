# UX: modais e diálogos bloqueantes

## Princípios

- **Bloqueio**: quando o produto exige reconhecimento antes de continuar (ex.: alertas de stock após login), o usuário não interage com a página abaixo até fechar o diálogo.
- **Consistência**: mesma semântica em desktop e mobile; em viewports **&lt; 640px**, diálogos de bloqueio de nível “alerta” podem adotar **bottom sheet** em altura total, mantendo captura de foco e fundo não clicável.

## Acessibilidade (obrigatório para popup de alertas de stock)

- Papel **`alertdialog`** no elemento raiz do diálogo.
- **Captura de foco** (focus trap) enquanto estiver aberto.
- **Backdrop** não clicável (cliques não dispensam o diálogo).
- **ESC** dispensa o diálogo (equivalente a “reconhecer e fechar” — registar `metodo`: `esc` na telemetria quando existir).
- Botão **OK** ou primário + controle **fechar** (ícone ou “Fechar”) com rótulos claros em PT-BR.
- Ao fechar, **devolver o foco** ao elemento que o tinha antes da abertura (ou ao primeiro elemento focável seguro da página, se não houver origem registável).

## Conteúdo

- Títulos e corpo em **português brasileiro**.
- Para alertas de stock: não exigir valores monetários nem fotos na lista resumida, salvo decisão de produto explícita em outra spec.

## Drawer lateral (sininho — não bloqueante)

- Usado para o [Centro de alertas](../features/inbox-centro-alertas/readme.md) a partir do cabeçalho: painel à **direita**, overlay sem interacção com a página por baixo até fechar, **ESC** e clique fora fecham, **foco** no primeiro controlo do drawer ao abrir e retorno de foco ao sininho ao fechar.
- **Não** substitui o `alertdialog` do popup pós-login; evitar dois diálogos bloqueantes em simultâneo.

## Referências cruzadas

- [Auth — fluxo pós-login](../features/auth/readme.md)
- [Painel — popup](../features/dashboard/readme.md)
- [Centro de alertas](../features/inbox-centro-alertas/readme.md)
