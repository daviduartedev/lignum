import type { ContractType } from "@prisma/client";
import { formatBRL } from "@/lib/pdf/format";

/**
 * Conteudo textual (RASCUNHO) por tipo de contrato - cycle 0614 Stage 4.
 *
 * Texto provisorio, estruturalmente coerente, a ser revisado e validado
 * juridicamente antes de uso oficial. O conteudo definitivo entra depois.
 */

export type ContractCopy = {
  title: string;
  intro: (vm: { contractValue: number | string }) => string;
  clauses: (vm: { contractValue: number | string }) => string[];
};

const COMPRA_VENDA: ContractCopy = {
  title: "Contrato de Compra e Venda de Veiculo",
  intro: () =>
    "Pelo presente instrumento particular, as partes acima qualificadas - de um lado o VENDEDOR e de outro o COMPRADOR - tem entre si justo e contratado o presente Contrato de Compra e Venda de Veiculo, que se regera pelas clausulas seguintes.",
  clauses: (vm) => {
    const valor = formatBRL(vm.contractValue);
    return [
      "CLAUSULA 1a - DO OBJETO. O VENDEDOR vende ao COMPRADOR, em carater irrevogavel e irretratavel, o veiculo automotor descrito neste instrumento, no estado em que se encontra, tendo o COMPRADOR plena ciencia de suas condicoes.",
      `CLAUSULA 2a - DO PRECO E FORMA DE PAGAMENTO. O preco certo e ajustado para a presente venda e de ${valor}, pago pelo COMPRADOR ao VENDEDOR na forma acordada entre as partes, dando-se quitacao na medida do efetivo recebimento.`,
      "CLAUSULA 3a - DA ENTREGA E POSSE. A posse do veiculo e transferida ao COMPRADOR nesta data, responsabilizando-se este, a partir de entao, por multas, tributos, encargos e quaisquer onus decorrentes do uso e da propriedade do bem.",
      "CLAUSULA 4a - DA TRANSFERENCIA. O COMPRADOR obriga-se a providenciar a transferencia da propriedade do veiculo junto ao orgao de transito competente no prazo legal, arcando com as despesas correspondentes.",
      "CLAUSULA 5a - DA GARANTIA. Salvo disposicao em contrario nas clausulas especiais, a venda observa as garantias legais aplicaveis aos bens usados, nos termos da legislacao consumerista vigente.",
      "CLAUSULA 6a - DO FORO. As partes elegem o foro da comarca do estabelecimento do VENDEDOR para dirimir quaisquer duvidas oriundas do presente contrato, com renuncia a qualquer outro, por mais privilegiado que seja.",
    ];
  },
};

const FINANCIAMENTO: ContractCopy = {
  title: "Contrato de Compra e Venda com Financiamento",
  intro: () =>
    "Pelo presente instrumento, o VENDEDOR e o COMPRADOR ajustam a compra e venda do veiculo descrito neste documento, cujo pagamento sera realizado mediante financiamento junto a instituicao financeira, nos termos das clausulas a seguir.",
  clauses: (vm) => {
    const valor = formatBRL(vm.contractValue);
    return [
      "CLAUSULA 1a - DO OBJETO. O VENDEDOR vende ao COMPRADOR o veiculo automotor descrito neste instrumento, no estado em que se encontra, declarando o COMPRADOR conhecer e aceitar suas condicoes.",
      `CLAUSULA 2a - DO PRECO. O valor total da operacao e de ${valor}, a ser quitado por meio de recursos provenientes de contrato de financiamento celebrado pelo COMPRADOR com instituicao financeira de sua escolha.`,
      "CLAUSULA 3a - DA ALIENACAO FIDUCIARIA. O COMPRADOR declara ciencia de que o veiculo podera permanecer alienado fiduciariamente a instituicao financiadora ate a quitacao integral do financiamento, constando tal gravame no registro do veiculo.",
      "CLAUSULA 4a - DA LIBERACAO DO CREDITO. A conclusao da venda fica condicionada a efetiva liberacao do credito pela instituicao financeira; nao havendo liberacao, as partes poderao desfazer o negocio, restituindo-se eventuais valores adiantados.",
      "CLAUSULA 5a - DAS OBRIGACOES DO COMPRADOR. Cabe ao COMPRADOR o pagamento das parcelas do financiamento nos respectivos vencimentos, bem como tributos, seguro, multas e encargos incidentes sobre o veiculo a partir da entrega.",
      "CLAUSULA 6a - DA TRANSFERENCIA E DO FORO. A transferencia observara as exigencias da instituicao financiadora e do orgao de transito. As partes elegem o foro da comarca do VENDEDOR para dirimir duvidas oriundas deste contrato.",
    ];
  },
};

const CONSORCIO: ContractCopy = {
  title: "Contrato de Compra e Venda por Consorcio",
  intro: () =>
    "Pelo presente instrumento, o VENDEDOR e o COMPRADOR ajustam a aquisicao do veiculo descrito neste documento, com pagamento vinculado a carta de credito de consorcio contemplada, conforme as clausulas a seguir.",
  clauses: (vm) => {
    const valor = formatBRL(vm.contractValue);
    return [
      "CLAUSULA 1a - DO OBJETO. O VENDEDOR vende ao COMPRADOR o veiculo automotor descrito neste instrumento, no estado em que se encontra, com plena ciencia do COMPRADOR quanto as suas condicoes.",
      `CLAUSULA 2a - DO PRECO E DA CARTA DE CREDITO. O valor ajustado e de ${valor}, a ser pago mediante carta de credito de consorcio contemplada de titularidade do COMPRADOR, observadas as regras da administradora de consorcio.`,
      "CLAUSULA 3a - DA LIBERACAO PELA ADMINISTRADORA. A conclusao do negocio fica condicionada a aprovacao e liberacao dos recursos pela administradora do consorcio, inclusive quanto a avaliacao e aceitacao do bem.",
      "CLAUSULA 4a - DA EVENTUAL DIFERENCA DE VALOR. Havendo diferenca entre o valor da carta de credito e o preco ajustado, o COMPRADOR complementara o saldo na forma acordada entre as partes.",
      "CLAUSULA 5a - DA ENTREGA E ENCARGOS. A posse e transferida ao COMPRADOR mediante a liberacao dos recursos, respondendo este por tributos, multas e encargos a partir de entao.",
      "CLAUSULA 6a - DA TRANSFERENCIA E DO FORO. A transferencia observara as exigencias da administradora e do orgao de transito. Elege-se o foro da comarca do VENDEDOR para dirimir duvidas deste contrato.",
    ];
  },
};

const LOCACAO: ContractCopy = {
  title: "Contrato de Locacao de Veiculo",
  intro: () =>
    "Pelo presente instrumento, o LOCADOR e o LOCATARIO ajustam a locacao do veiculo descrito neste documento, mediante as clausulas e condicoes a seguir.",
  clauses: (vm) => {
    const valor = formatBRL(vm.contractValue);
    return [
      "CLAUSULA 1a - DO OBJETO. O LOCADOR cede ao LOCATARIO, a titulo de locacao, o veiculo automotor descrito neste instrumento, em condicoes de uso, comprometendo-se o LOCATARIO a conserva-lo e restitui-lo no mesmo estado.",
      `CLAUSULA 2a - DO VALOR E DA PERIODICIDADE. O valor da locacao e de ${valor} por periodo contratado, pago pelo LOCATARIO ao LOCADOR nas datas e na forma acordadas entre as partes.`,
      "CLAUSULA 3a - DO PRAZO. A locacao vigora pelo prazo ajustado entre as partes, podendo ser prorrogada por acordo escrito; a devolucao antecipada observara as condicoes pactuadas.",
      "CLAUSULA 4a - DAS OBRIGACOES DO LOCATARIO. O LOCATARIO responde por combustivel, multas, infracoes, avarias e quaisquer danos causados ao veiculo durante a locacao, bem como pela sua guarda e uso adequado.",
      "CLAUSULA 5a - DO SEGURO E MANUTENCAO. Salvo disposicao em contrario nas clausulas especiais, a responsabilidade por seguro e manutencao sera definida entre as partes, mantendo-se o veiculo em condicoes de circulacao.",
      "CLAUSULA 6a - DA RESTITUICAO E DO FORO. Ao termino da locacao, o LOCATARIO restituira o veiculo ao LOCADOR. As partes elegem o foro da comarca do LOCADOR para dirimir duvidas oriundas deste contrato.",
    ];
  },
};

const COPY_BY_TYPE: Record<ContractType, ContractCopy> = {
  compra_venda: COMPRA_VENDA,
  financiamento: FINANCIAMENTO,
  consorcio: CONSORCIO,
  locacao: LOCACAO,
};

export function contractCopyFor(type: ContractType): ContractCopy {
  return COPY_BY_TYPE[type] ?? COMPRA_VENDA;
}

/** Rotulos de papeis por tipo (vendedor/comprador vs locador/locatario). */
export function partyLabelsFor(type: ContractType): { issuer: string; client: string } {
  if (type === "locacao") return { issuer: "Locador", client: "Locatario" };
  return { issuer: "Vendedor", client: "Comprador" };
}
