import { OrcamentoDetalhe } from "@/components/comercial/OrcamentoDetalhe";

export default async function OrcamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrcamentoDetalhe routeId={id} />;
}
