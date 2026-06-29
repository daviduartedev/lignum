# Auditoria — consultas externas (SENATRAN / CNPJ cadastral)

Registo de chamadas a provedores externos para **rastreabilidade**, **custo** e **disputas operacionais**.

## Modelos

| Model | Domínio | Chave de cache |
|-------|---------|----------------|
| `SenatranLookupAudit` | Consulta veicular (placa/RENAVAM) | Placa normalizada |
| `DocumentLookupAudit` | Consulta cadastral **CNPJ** (clientes/fornecedores) | CNPJ (só dígitos) |

## O que registar (mínimo)

Por cada tentativa de consulta bem-sucedida ou falha persistida para análise:

- **Identificador interno** da tentativa (id autoincremento).
- **Documento consultado** normalizado (`documentNormalized` / placa) — **não** expor em logs de aplicação em claro.
- **Utilizador** (id da sessão) e **timestamp**.
- **Provedor** (`mock`, `brasilapi`, nome comercial do HTTP, etc.).
- **Custo** atribuído à consulta (`Decimal(14,4)`; 0 em modo demonstração).
- **Snapshot** do payload retornado (ou erro estruturado + corpo parcial), para confronto posterior.
- **`cachedResponse`** quando a resposta veio de cache em memória (sem nova chamada HTTP).

## Acesso

- **Leitura do snapshot:** restrita a perfis **admin** (ver [`features/auth/readme.md`](../features/auth/readme.md) / [`security/authorization-matrix.md`](../security/authorization-matrix.md)).
- **Não** expor snapshot em listagens públicas nem em exportações gerais sem controlo.
- Agregação mensal de custo CNPJ: `GET /api/document-lookup/usage` (admin).

## Relação com cadastros

- **Veículo:** metadados de última consulta SENATRAN na UX quando aplicável; detalhe completo na auditoria.
- **Client / Supplier:** autofill usa DTO normalizado; `registrationStatus` e endereço persistem no cadastro; payload bruto permanece em `DocumentLookupAudit`.

## Telemetria

Eventos de produto (`senatran_consulta_*`, `document_lookup_*`) complementam a auditoria mas **não** substituem o registo persistido para custo e compliance operacional.
