import { ProducaoDetalhe } from "@/components/producao/ProducaoDetalhe";

type Props = { params: Promise<{ id: string }> };

export default async function ProducaoDetalhePage({ params }: Props) {
  const { id } = await params;
  return <ProducaoDetalhe routeId={id} />;
}
