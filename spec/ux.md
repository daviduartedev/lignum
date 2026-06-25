# UX Guidelines

## Princípios

- Um único padrão de feedback por tipo de evento.
- Mensagens sempre em **português do Brasil**, diretas e orientadas à ação.
- Não revelar stack traces ou `code`s internos para o usuário final.

## Toasts

- Biblioteca: `react-toastify` (já no `providers.tsx`).
- Helper: `src/lib/toast.ts`
  - `toast.success(msg)` — verde, autoclose 4.8s.
  - `toast.info(msg)` — azul/neutro.
  - `toast.apiError(err)` — reconhece `ApiError` (ver `src/lib/apiClient.ts`) e
    exibe a `message` do envelope de erro; para outros erros, fallback
    `"Erro inesperado. Tente novamente."`.
- **Sucesso** de mutação: mensagem de domínio (ex.: "Veículo atualizado com sucesso!").
- **Erro** de mutação ou query: `toast.apiError(err)`.

## Spinner global

- Componente `src/components/GlobalSpinner.tsx` (client).
- Ouve `useIsFetching() + useIsMutating()` do React Query.
- Barra de progresso no topo da tela (estilo GitHub / NProgress) enquanto > 0.
- Não há skeletons por componente; listagens mostram placeholder único
  "Carregando..." enquanto não há dados, e o spinner global cobre transições.

## Paginação

- Componente `src/components/ui/pagination.tsx`.
- 10 itens por página (default).
- Exibe: `« anterior | Página X de Y | próxima »`.
- Em listagens vazias, esconde controles e mostra estado vazio amigável.

## Formulários

- Validação no cliente via Zod (mesmo schema do backend, importado de
  `src/lib/zodSchemas.ts`).
- Feedback de campo inline (`<p class="text-red-500">...`).
- Submit bloqueia botão enquanto `isPending`.
- Em erro 422 (`VALIDATION_ERROR`), aplicar `details` aos campos e disparar o toast.

## Navegação

- Sidebar lista todas as áreas (`src/components/Sidebar.tsx`).
- Topbar com avatar, nome, menu logout.
- `/configuracoes` só aparece na Sidebar para admins.

## Páginas de erro

- `src/app/error.tsx` — global; captura crashes de render; botão "Tentar novamente".
- `src/app/(main)/error.tsx` — segmento autenticado; idem.
- `src/app/not-found.tsx` — 404 amigável com link para `/`.

## Estados vazios

- Toda listagem deve ter um estado vazio com:
  - ícone ou ilustração leve (Lucide);
  - texto em PT-BR;
  - CTA primário ("Cadastrar primeiro cliente", etc.) quando aplicável.

## Acessibilidade

- Inputs com `label` e `id` correspondentes.
- Botões destrutivos (excluir) usam `<AlertDialog>` para confirmar.
- Focus states visíveis (Tailwind `focus-visible:ring`).

## Cores / tokens

- Tokens em `src/app/globals.css` + Tailwind 4.
- Estado do sistema:
  - Sucesso: green-500.
  - Erro: red-500.
  - Aviso: amber-500.
  - Info: sky-500.
