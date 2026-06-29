# LGPD e minimizacao de dados

Complementa controles gerais em [`../features/security/readme.md`](../features/security/readme.md).

## Principios

1. **Finalidade**: dados pessoais e payloads de terceiros so podem ser tratados para suportar a operacao real do produto.
2. **Minimizacao**: o sistema nao deve exibir, persistir nem logar mais dados pessoais do que o minimo necessario para o fluxo.
3. **Segregacao**: dados de tenants distintos nao podem ficar visiveis nem acessiveis entre si fora de contexto autorizado.
4. **Rastreabilidade**: auditoria e prova operacional podem existir, mas com acesso restrito e trilha de quem consultou.

## Dados de terceiros

1. Dados recebidos de APIs externas, como consulta veicular, servem para identificar o veiculo e apoiar a operacao da revenda.
2. Campos de pessoa fisica, como CPF/CNPJ de proprietario, nome completo, endereco e dados equivalentes, nao entram no formulario operacional nem no modelo consultavel por padrao.
3. Snapshot bruto ou normalizado so pode ser guardado para prova operacional ou disputa, com acesso restrito conforme [`../audit/readme.md`](../audit/readme.md).
4. Debitos, multas e IPVA de titular continuam fora do escopo ate avaliacao juridica propria.

## Dados cadastrais de clientes (staff)

- **`personType`** (PF/PJ) em `Client`: dado cadastral sem sensibilidade especial elevada, mas visibilidade restrita a **staff** autenticado.
- **`document`** (CPF/CNPJ): máscara conforme `personType`; **não** logar em texto claro em logs de servidor ou telemetria externa.
- **`minimumSellingPrice`** em `Vehicle`: dado comercial interno da revenda; **sem** implicação LGPD directa.

## Cadastro staff — consulta CNPJ (cycle 0706)

- Consulta CNPJ em fontes públicas/comerciais para **pré-preencher** cadastro iniciado pelo operador autorizado é finalidade legítima de operação comercial.
- Dados normalizados persistem em `Client` / `Supplier`; payload bruto em `DocumentLookupAudit` (acesso **admin**).
- A regra § "Dados de terceiros" que impede autofill de titular veicular (**SENATRAN**) **não** se aplica a contrapartes comerciais cadastradas pelo staff.
- **Consulta externa de CPF** de clientes PF permanece **fora de escopo** neste produto (cadastro manual).

## Logging e observabilidade

- Logs externos nao devem conter senha, token, secret, hash, CPF, CNPJ, telefone, email, endereco, nome completo, dado bancario nem identificador sensivel de tenant em claro.
- Deve existir redacao automatica centralizada por campo antes do envio para observabilidade.
- Quando auditoria interna precisar de dado pessoal para investigacao, esse armazenamento fica separado, com acesso restrito e trilha de acesso.
- `correlationId` e preferido como chave de investigacao do incidente no lugar de payload bruto.

## Retencao e analytics

- Logs operacionais seguem retencao minima necessaria para suporte e seguranca; o prazo exato deve ser definido por ambiente e provedor.
- Analytics e telemetria usam dados anonimizados ou agregados sempre que o caso de uso nao exigir identificacao direta.
- Dados usados apenas para debugging nao devem virar base permanente.

## Exclusao e ciclo de vida

- O produto deve permitir aplicar politicas de exclusao ou anonimiazacao quando houver obrigacao legal ou decisao administrativa valida.
- A exclusao de um tenant ou utilizador precisa considerar caches, logs, snapshots e artefatos derivados no desenho futuro.

## Responsabilizacao

Operadores continuam obrigados a usar dados apenas para a atividade da revenda. Logs e auditoria apoiam rastreabilidade, mas nao substituem requisito legal proprio quando a lei exigir base, consentimento ou registro adicional.
