# Auditoria — consultas externas (SENATRAN / veículo)

Registo de chamadas a provedores de dados veiculares para **rastreabilidade**, **custo** e **disputas operacionais**.

## O que registar (mínimo)

Por cada tentativa de consulta bem-sucedida ou falha persistida para análise:

- **Identificador interno** da tentativa (UUID ou id de linha).
- **Placa** normalizada e, se aplicável, **RENAVAM** usado no fallback.
- **Utilizador** (id da sessão) e **timestamp** (UTC ou fuso documentado na app).
- **Provedor** (`mock`, nome comercial do HTTP, etc.).
- **Custo** atribuído à consulta (0 em modo demonstração).
- **Snapshot** do payload retornado (ou erro estruturado + corpo parcial), para confronto posterior.

## Acesso

- **Leitura do snapshot:** restrita a perfis administrativos (ver [`features/auth/readme.md`](../features/auth/readme.md) / matriz de papéis no código).
- **Não** expor snapshot em listagens públicas nem em exportações gerais sem controlo.

## Relação com o veículo

- O cadastro do veículo referencia metadados de última consulta quando fizer sentido para UX (ex.: data da última consulta); o **detalhe completo** permanece na auditoria.

## Telemetria

Eventos de produto (`senatran_consulta_*`, `senatran_campo_sobrescrito_manualmente`) complementam a auditoria mas **não** substituem o registo persistido para custo e compliance operacional.
