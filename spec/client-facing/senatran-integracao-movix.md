# Integração de dados veiculares (SENATRAN / base nacional) — Movix

**Audiência:** decisor na revenda (comprador B2B).  
**Idioma:** PT-BR.  
**Revisão de conteúdo:** 2026-04-20 (alinhamento a fontes oficiais indicadas abaixo; **confirmar sempre** preços e contratos na data da sua contratação).

---

## 1. O que o Movix faz neste fluxo

- O operador informa a **placa** (e, quando aplicável, dados adicionais exigidos pelo provedor) no cadastro do veículo.
- A aplicação solicita uma **consulta normalizada** a um **provedor** configurado na infra-estrutura da revenda (ambiente de desenvolvimento vs produção).
- Os campos devolvidos **pré-preenchem** o formulário; o operador pode **corrigir manualmente** campos sensíveis. A regra de produto distingue valores **oficiais da última consulta** vs **editados manualmente** (ver [`spec/features/vehicles/readme.md`](../features/vehicles/readme.md)).
- Cada tentativa relevante gera **registo para auditoria e custo** (ver [`spec/audit/readme.md`](../audit/readme.md)).

## 2. Modo demonstração (“mock”) vs produção

| Ambiente típico | Comportamento |
|-----------------|---------------|
| **Desenvolvimento / demonstração** | Provedor **`mock`**: respostas **simuladas**, **sem** chamada ao órgão oficial; **custo zero** para efeito de fatura do terceiro; serve para treino e QA. |
| **Produção** | Provedor **HTTP** (ou equivalente) com credenciais e URLs em **variáveis de ambiente**; consultas **facturáveis** segundo o contrato do **provedor oficial ou parceiro contratado** pela revenda. |

A Movix **não substitui** o contrato de consulta veicular da revenda com o órgão ou distribuidor autorizado: a aplicação **consome** o serviço configurado.

## 3. Canal oficial de consulta e preços (Brasil)

- O **Serviço Federal de Processamento de Dados (SERPRO)** opera a solução **Consulta Online Senatran**, com informação sobre produtos, adesão e **preços** na **Central de Ajuda** e na **Loja SERPRO**.
- **Central de Ajuda — preços (Consulta Online Senatran):**  
  https://centraldeajuda.serpro.gov.br/consultasenatran/precos/  
  (página consultada para esta revisão; indica que os valores são **regulados por Portaria do Senatran** e **reajustados** conforme novas portarias; última menção editorial na própria página: **24 de março de 2026**.)
- **Loja SERPRO — produto Consulta Senatran:**  
  https://www.loja.serpro.gov.br/consultasenatran  
  (local indicado pelo SERPRO para **preços actualizados** conforme portaria vigente.)
- **Quadro legal:** as consultas de dados de veículo / condutor / infrações são historicamente reguladas por portarias do **Senatran**; a Central de Ajuda cita, entre outras, a **Portaria Senatran nº 461, de 18 de junho de 2025**, como vigente **quando da publicação** daquele conteúdo. O **texto legal completo** deve ser obtido no **Diário Oficial da União** ou no **site do governo** (`gov.br`) — não reproduzir aqui tabela de preços como se fosse permanente: **faixas por volume** e valores **mudam** com nova portaria.

### 3.1 O que comunicar ao cliente sobre custo

1. O custo **unitário** depende do **tipo de consulta** (ex.: básica vs detalhada, com ou sem indicadores/imagem, conforme catálogo SERPRO) e do **volume** contratado (modelo de **faixas progressivas** descrito na Central de Ajuda).
2. O **valor na fatura** da revenda vem do **provedor contratado** (ex.: SERPRO), não de uma “taxa Movix” sobre o SENATRAN.
3. Para proposta comercial: incluir **hiperligação** à Loja SERPRO e à página de preços, e uma frase de **isento de responsabilidade** de que os números foram validados em **2026-04-20** e podem alterar.

## 4. Integração técnica (resumo para TI do cliente)

- Padrão da aplicação: **adapter** por provedor, timeouts, cache por placa com TTL, rate limit e **continuidade em modo manual** se o serviço falhar (ver [`spec/architecture.md`](../architecture.md) — Integrações externas).
- Dados pessoais e payloads de terceiros: ver [`spec/security/lgpd.md`](../security/lgpd.md).

## 5. Limites do produto (transparência)

- O Movix **não** consulta, neste âmbito, débitos de IPVA/multas em tempo real como produto separado, salvo futura extensão documentada na spec de veículos.
- **Snapshot** de respostas e dados sensíveis: acesso administrativo e políticas de auditoria — ver [`spec/audit/readme.md`](../audit/readme.md).

## 6. Opcional — agregadores privados

Existem **integradores comerciais** que oferecem APIs sobre bases públicas ou conveniadas; qualquer uso deve respeitar **contrato**, **LGPD** e **termos do fornecedor**. Para **preço oficial** do serviço federal canalizado pelo SERPRO, prevalecem as fontes da secção 3.

---

**Nota de implementação:** a rota canónica da página imprimível na app deve constar em [`spec/features/vehicles/readme.md`](../features/vehicles/readme.md) (secção “Briefing cliente”).
