# Feature: Vehicles

Gestão de veículos do estoque (compra, exposição, venda, movimentação).

## Modelo

`Vehicle` — ver [`../../data-model.md`](../../data-model.md).

Campos-chave: `plate`, `brand`, `model`, `yearManufacture`, `yearModel`, `mileage`,
`purchasePrice`, `sellingPrice?`, **`minimumSellingPrice?`**, `status`, `mainPhotoUrl?`, `galleryUrls[]`,
`attachmentUrls[]`, `buyerId?`.

### Preço de venda mínimo (`minimumSellingPrice`)

- Campo **opcional** (`Decimal`, informativo neste ciclo).
- Exibido na secção **Preços** do formulário de cadastro/edição.
- **Não** bloqueia venda abaixo do valor — evolução futura pode adicionar validação na conclusão de venda.

### Campos operacionais de compra (cadastro enriquecido)

Além dos campos já existentes (incluindo SENATRAN), o cadastro do veículo no estoque pode registrar dados operacionais da compra/entrada:

- **Portas**: `doorsCount?` (valores permitidos: **2** ou **4**).
- **Último licenciamento**: `lastLicensingDate?` (apenas **data**, sem hora).
- **Entrada na compra**:
  - `purchaseEntryAt?` (**data/hora** de entrada/registro no momento da compra)
  - `purchaseEntryMileage?` (**KM** de entrada no momento da compra; não substitui necessariamente `mileage`)
  - **UI (data):** selector `DatePickerField` com placeholder **«Selecione a data aqui»** — não usar `input type="date"` nativo (evita placeholder `dd/mm/aaaa` do browser).
- **Fornecedor / intermediador**:
  - vínculo opcional para `Supplier` (`purchaseSupplierId?`), usando o cadastro existente de fornecedores.
  - a UI deve permitir **selecionar** fornecedor existente e **criar** um novo durante o cadastro, vinculando-o ao veículo.
- **Pagamento da compra**:
  - capturado como estrutura em `purchasePaymentJson?` para suportar modalidades e campos variáveis sem criar regra nova aqui.
  - o lançamento no Financeiro é disparado por uma acção explícita **“Confirmar compra”** (não no save do formulário).
  - a integração deve respeitar o **contrato existente** do módulo Financeiro (não criar caminho paralelo).

### Cadastro enriquecido por consulta SENATRAN (alvo)

Além dos campos acima, o modelo prevê identificação e contexto legal do veículo:

- **Identificação:** `renavam`, `chassis` (17 caracteres, sem I/O/Q), `plate` (já existente).
- **Classificação:** tipo de veículo (`VehicleCategoryKind`: carro, moto, ônibus, jet-ski, outros) permanece no modelo e no payload para integrações; na **UI staff**, o operador vê e edita a classificação sob o rótulo canónico **Espécie/Categoria** (`speciesCategory`), **sem** campo ou rótulo separado “Tipo” apenas para essa decisão.
- **Dados descritivos:** cor, combustível (`FuelType`), município e UF de emplacamento.
- **Situação legal** (`VehicleLegalSituation`): regular, irregular, com restrição — **distinto** de `VehicleStatus` (estoque: disponível, vendido, …).
- **Consulta cautelar** (`VehicleCautelar`): não, leilão, sinistro, leilão e sinistro, outras restrições — alimenta “pontos de atenção” e decisões futuras de precificação.
- **Título do anúncio:** texto editável; default sugerido = modelo.
- **Outros dados oficiais:** JSON read-only na UI (pares label/valor); não duplicar em colunas de negócio salvo o JSON agregado.

**Filial / unidade:** permanecem como conceito interno da revenda quando existirem no produto; **não** vêm da API SENATRAN.

**Indicadores por campo:** a UI distingue valor **vindo da última consulta oficial** vs. **editado manualmente**; re-consultas não sobrescrevem campos já marcados como manuais até o operador confirmar uma **re-consulta** explícita (lista campo a campo do que será atualizado).

**Integração:** ver [Integrações externas](../../architecture.md#integrações-externas); LGPD: [`../../security/lgpd.md`](../../security/lgpd.md); auditoria: [`../../audit/readme.md`](../../audit/readme.md).

### Briefing para o cliente (SENATRAN)

- **Texto canónico:** [`../../client-facing/senatran-integracao-movix.md`](../../client-facing/senatran-integracao-movix.md) — explicação para decisor na revenda (mock vs produção, custos de referência via SERPRO, LGPD, limites).
- **Na app (staff):** página **imprimível** com o mesmo conteúdo (ou gerada a partir da mesma fonte), rota canónica sugerida **`/documentacao/senatran`**, com estilos **`@media print`** para exportação **PDF** pelo utilizador (“Guardar como PDF” no browser). Link de entrada: hub de **Configurações** / documentação interna (exacto na implementação, mantido coerente com a navegação actual).

## Endpoints (`withRole(staffRoles)`)

- `GET /api/vehicles?page&pageSize&status&plate`
- `POST /api/vehicles`
- `GET /api/vehicles/[id]`
- `PUT /api/vehicles/[id]`
- `DELETE /api/vehicles/[id]`
- `POST /api/senatran/lookup` — consulta por placa (e RENAVAM em fallback quando o provedor suportar); resposta normalizada para pré-preenchimento; rate limit dedicado; cache por placa (TTL via env).
- `GET /api/senatran/usage` — **admin**: custo acumulado no mês civil (agregado das consultas registadas).

Filtros: `status` (`VehicleStatus`), `plate` (contains).

## Validação (Zod)

`vehicleCreateSchema` em `src/lib/zodSchemas.ts`. Regras notáveis:

- `plate` obrigatória, formato Mercosul ou tradicional.
- `renavam` e `chassis` obrigatórios após extensão SENATRAN (validação de chassi: 17 alfanuméricos, sem I/O/Q).
- `yearManufacture <= yearModel`.
- `mileage >= 0`.
- `purchasePrice` obrigatório; `sellingPrice` opcional mas > 0 se presente.
- `minimumSellingPrice` opcional; se presente, > 0.

## UI

- Lista: `/estoque` (via `src/components/pages/Estoque.tsx`); filtros e deep links: [Estoque](../estoque/readme.md).
- Detalhe: `/veiculo/[id]`.
  - Card **"Compra (opcional)"** visível **apenas** quando `status === "standby_nao_compra"`; oculto integralmente nos demais status (sem placeholder N/A).
- Criação: `/veiculo/novo`.
- Edição: `/veiculo/[id]/editar`.

A **vitrine** (prévia da loja pública) consome os mesmos veículos com conjunto de campos limitado ao visitante; ver [Vitrine](../storefront/readme.md).

### Fluxo SENATRAN na UI

- Ação explícita **“Buscar dados oficiais”** (e atalho Enter no campo placa); **sem** auto-fetch ao digitar.
- **Loading:** skeleton nos campos que serão preenchidos.
- **Erros** distintos: placa inválida, não encontrada, falha de API, timeout, cota excedida; em qualquer caso o operador pode **seguir em modo manual**.
- **Cache de sessão:** não repetir a mesma consulta no mesmo formulário sem ação nova.
- **Re-consultar** na edição: confirmação com lista **campo a campo**; aplicar ao estado do formulário; **guardar** persiste no servidor.
- **Admin:** exibir custo acumulado do **mês civil** (America/São_Paulo); em modo `mock`, indicar demonstração ou custo zero.

## Dias em stock (referência)

Para KPIs do [Painel](../dashboard/readme.md) e para o filtro `diasMin` do estoque, **dias parado** segue o helper `vehicleDaysInStock` em `src/types/index.ts` (regra v1 documentada na spec do painel).

## Estados & erros

- `CONFLICT` — operação que violaria unicidade (raro — `plate` não é unique no schema,
  mas a UI pode desencorajar duplicação).
- `NOT_FOUND` → toast + navegação para `/estoque`.
- Paginação visível (10/página).

## Relacionamentos dependentes

- Sale (1..1), Contract (N), Evaluation (N), ServiceOrder (N), Warranty (N),
  PromissoryNote (N). `onDelete`: `Sale` e `Evaluation`/`ServiceOrder` cascata;
  os demais bloqueiam exclusão se houver registros.

## Mídia (fotos e anexos)

| Campo | Descrição |
|-------|-----------|
| `mainPhotoUrl?` | URL HTTPS pública da foto principal (Vercel Blob quando enviada pela app) |
| `galleryUrls[]` | URLs da galeria |
| `attachmentUrls[]` | Anexos (PDF/imagem); botão Abrir em Documentos usa `[0]` |

Persistência: **PostgreSQL only** — não há escrita em filesystem local da Vercel.

### Upload (cadastro/edição)

- Etapa **Fotos** em `FormVeiculo`: seleção, preview local (`URL.createObjectURL`), envio no submit.
- Storage: **Vercel Blob** via `POST /api/upload` (server-side); prefixo `autocore/`, `access: public`.
- Pré-requisitos env: `BLOB_READ_WRITE_TOKEN`, `ENABLE_SERVER_UPLOADS=true`, `UPLOAD_SECURITY_CHECKLIST_CONFIRMED=true`.
- Store Blob deve ser **Public** (URLs servidas sem auth adicional).
- Substituição: nova foto principal no save actualiza `mainPhotoUrl`.
- **Remoção:** preview local pode ser limpo antes de guardar; **não** há UI para remover foto principal/galeria já persistida sem substituir (workaround: API/BD).
- Upload desactivado (CI/dev por defeito): mensagem PT-BR «Upload de ficheiros não está disponível nesta versão.»; operador pode guardar veículo sem alterar fotos existentes.

### Import de foto sugerida (staff)

- `POST /api/vehicles/suggested-photos`: busca 1 imagem Unsplash pelo título marca+modelo+versão e persiste no Blob (requer upload activo).
- Catálogo curado `src/data/vehicle-model-images.json` (Wikimedia, `source`/`licenseNote` por entrada) — usado pelo import e helpers; chave normalizada `brand/model`.

### Fallback visual (exibição)

Ordem em `VehicleThumbnail` / `DetalheVeiculoGallery`:

1. `mainPhotoUrl` válida (foto real ou upload Blob).
2. **Unsplash** via `GET /api/vehicles/unsplash-photo?brand&model&version` (1 imagem genérica por título; staff only).
3. Ícone neutro (`Car` / `ImageIcon`) se Unsplash falhar ou URL quebrada (`onError`).

Vitrine (`/loja`) usa o mesmo componente `VehicleThumbnail`.

**Nota:** imagens Unsplash são genéricas por modelo/título, não do veículo físico. Thumbnail na tela de venda (D6) permanece fora de escopo deste ciclo.

## Fora do escopo actual

- Thumbnail do veículo na tela de venda (`/venda/<id>`).
- Upload em Avaliação e OS.
- Consulta de débitos, multas, IPVA; painel administrativo de uso detalhado (apenas custo mensal agregado neste âmbito).
- Alteração das regras de KPIs do [Painel](../dashboard/readme.md) para consumir cautelar automaticamente (ciclo posterior).
