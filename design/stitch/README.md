# Design de referência — Stitch (Lignum Gestão)

Telas de UX/UI desenhadas no Stitch, usadas como **referência** para implementar a UI de cada
cycle. Cada pasta traz:

- **`screen.png`** — render da tela (referência visual definitiva).
- **`code.html`** — HTML + Tailwind (via CDN) gerado pelo Stitch. É **protótipo**, não plugável
  direto no Next (o projeto usa Tailwind 4 + shadcn + lucide-react, e o Stitch usa Tailwind CDN
  + Material Symbols). Serve como base de layout/estrutura a traduzir para os componentes do repo.

O design system completo do Stitch (tokens, tipografia, regras de componentes) está em
**`STITCH-DESIGN.md`** nesta pasta — alinhado com `spec/design-system.md`.

**Política de entrega (ADR-0009, a partir do cycle 0713):** paridade visual com o Stitch
mapeado ao cycle é **critério de aceite** na última stage de produto — não follow-up. Cycles
anteriores (0623–0706) podem ter entregue só funcionalidade; polish deferido do 0706 entra
como Stage 1 do 0713. Ver [`spec/adr-staging.md`](../../spec/adr-staging.md).

> **Precedência:** os tokens em `src/styles/theme.css` / `src/lib/brand.ts` mandam sobre o
> `code.html`. A paleta do Stitch confere com a marca (Azul Royal `#0234C9`, sidebar preta,
> accent `#046CEB`). Atenção: o `STITCH-DESIGN.md` traz alguns tons extras (ex.: `primary
> #002392`, `background #f9f9ff`) — usar a paleta canônica da marca quando houver divergência.

## Como usar

1. Para cada tela, abra o `screen.png` (alvo visual) e o `code.html` (estrutura de layout).
2. Implemente no cycle correspondente recriando a UI com os componentes do repo
   (`src/components/ui/*`) e os tokens da marca — não cole o HTML do Stitch direto.
3. Mantenha o nome da pasta — ele liga a tela ao cycle (ver tabela) e o `spec/design-system.md`
   referencia esse caminho. Telas que o Stitch não gerou têm um `README.md` indicando a base.

## Mapa tela → cycle

| Pasta | Tela | Cycle |
|---|---|---|
| `00-login` | Login | 0623-fundacao-rebrand-core |
| `01-painel-dashboard` | Painel (dashboard, KPIs, alertas) | 0623-fundacao-rebrand-core |
| `02-usuarios-permissoes` | Usuários e permissões | 0629-auth-usuarios-permissoes |
| `03-clientes` | Clientes e fornecedores (lista) | 0706-cadastros-clientes-cpf-cnpj |
| `04-cliente-detalhe` | Cliente — detalhe + documentos | 0706-cadastros-clientes-cpf-cnpj |
| `05-empresa-configuracoes` | Dados da empresa / configurações | 0706-cadastros-clientes-cpf-cnpj |
| `06-orcamentos-lista` | Orçamentos (lista) | 0713-orcamentos-fichas-pdf |
| `07-orcamento-novo` | Novo orçamento (form paramétrico + total) | 0713-orcamentos-fichas-pdf |
| `08-ficha-tecnica` | Ficha técnica (BOM) | 0713-orcamentos-fichas-pdf |
| `09-producao-kanban` | Produção / OS (kanban) | 0720-producao-os-estoque |
| `10-os-detalhe` | OS — detalhe (ficha, funcionários, fotos) | 0720-producao-os-estoque |
| `11-estoque-materiais` | Estoque de matérias-primas | 0720-producao-os-estoque |
| `12-carrocerias-usadas` | Carrocerias usadas | 0720-producao-os-estoque |
| `13-funcionarios` | Funcionários (produtividade) | 0720-producao-os-estoque |
| `14-financeiro` | Financeiro (abas + lucro por orçamento) | 0727-financeiro-lucro |
| `15-notas-fiscais` | Notas fiscais (NF-e/NFS-e) | 0803-nf-relatorios |
| `16-relatorios` | Relatórios + export | 0803-nf-relatorios |
| `17-configurador-3d` | Configurador 3D (viewport + controles) | 0810-3d-homologacao-golive |

## Observações

- A paleta do Stitch deve bater com os tokens: Azul Royal `#0234C9` (primary), Azul Claro
  `#046CEB` (accent), sidebar preta. Se algo divergir, **o token manda** — ajuste o print mentalmente.
- O configurador 3D (`17-`): o Stitch entrega só a **moldura visual** (viewport + controles). O
  3D funcional é implementado com `react-three-fiber` no cycle 0810.
- Faltou alguma tela? Crie a pasta seguindo o padrão `NN-nome` e adicione na tabela + no
  `spec/design-system.md`.
