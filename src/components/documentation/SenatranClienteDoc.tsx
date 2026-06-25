/** Conteúdo alinhado a `spec/client-facing/senatran-integracao-lignum.md` (revisão 2026-04-20). */

export function SenatranClienteDoc() {
  return (
    <article className="senatran-client-doc space-y-6 text-sm text-foreground leading-relaxed">
      <header className="space-y-2 border-b border-border pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Lignum Gestão / AlaCruz</p>
        <h1 className="text-2xl font-semibold tracking-tight">Integração de dados veiculares (SENATRAN / base nacional)</h1>
        <p className="text-muted-foreground">
          Documento para decisores na revenda. Revisto em <strong>20 de abril de 2026</strong>. Confirme preços e contratos na data da sua
          contratação.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. O que o Lignum faz neste fluxo</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>O operador informa a <strong>placa</strong> (e dados adicionais quando o provedor exigir) no cadastro do veículo.</li>
          <li>A aplicação solicita uma <strong>consulta normalizada</strong> ao provedor configurado na infra-estrutura (desenvolvimento vs produção).</li>
          <li>Os campos devolvidos <strong>pré-preenchem</strong> o formulário; o operador pode corrigir manualmente valores sensíveis.</li>
          <li>Consultas relevantes ficam registradas para <strong>auditoria e custo</strong> (perfis administrativos).</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Modo demonstração (“mock”) vs produção</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border p-2">Ambiente típico</th>
                <th className="border-b border-border p-2">Comportamento</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-border/80 p-2 align-top">Desenvolvimento / demonstração</td>
                <td className="border-b border-border/80 p-2">
                  Provedor <strong>mock</strong>: respostas simuladas, sem chamada ao órgão oficial; custo de terceiro <strong>zero</strong>.
                </td>
              </tr>
              <tr>
                <td className="p-2 align-top">Produção</td>
                <td className="p-2">
                  Provedor <strong>HTTP</strong> (ou equivalente) com credenciais em variáveis de ambiente; consultas podem ser{" "}
                  <strong>facturáveis</strong> conforme o contrato do SERPRO ou parceiro autorizado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          O Lignum <strong>não substitui</strong> o contrato de consulta veicular da fábrica: a aplicação consome o serviço que a empresa
          configurar.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Canal oficial e preços (Brasil)</h2>
        <p>
          O <strong>SERPRO</strong> opera a solução <strong>Consulta Online Senatran</strong>. Os preços são regulados por{" "}
          <strong>Portarias do Senatran</strong> (ex.: Portaria Senatran nº 461, de 18 de junho de 2025, citada na Central de Ajuda como referência
          legal) e <strong>reajustados</strong> quando publicada nova portaria.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Central de Ajuda, preços:{" "}
            <a className="text-emerald-700 underline" href="https://centraldeajuda.serpro.gov.br/consultasenatran/precos/">
              centraldeajuda.serpro.gov.br/consultasenatran/precos
            </a>
          </li>
          <li>
            Loja SERPRO, produto:{" "}
            <a className="text-emerald-700 underline" href="https://www.loja.serpro.gov.br/consultasenatran">
              www.loja.serpro.gov.br/consultasenatran
            </a>
          </li>
        </ul>
        <p className="rounded-md bg-muted/50 p-3 text-xs">
          O modelo oficial usa <strong>faixas por volume</strong> de consultas. <strong>Não</strong> reproduza valores deste documento como orçamento
          definitivo: abra sempre a loja oficial na data do pedido.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Integração técnica (resumo para TI)</h2>
        <p>
          Adapter por provedor, timeouts, cache por placa com TTL, rate limit e continuidade em <strong>modo manual</strong> se o serviço falhar.
          Variáveis de ambiente para URLs e chaves.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Privacidade e limites</h2>
        <p>
          Minimização de dados pessoais e tratamento de payloads de terceiros conforme a política LGPD da revenda e do fornecedor. Snapshots de
          consulta para auditoria, acesso restrito a perfis administrativos.
        </p>
        <p className="text-xs text-muted-foreground">
          Este texto resume o comportamento do produto; não constitui aconselhamento jurídico. Para cláusulas contratuais, envolva o jurídico da
          revenda e o distribuidor oficial (ex.: SERPRO).
        </p>
      </section>
    </article>
  );
}
