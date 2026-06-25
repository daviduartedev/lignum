import { Avaliacao } from "@/components/avaliacao/Avaliacao";

export default async function AvaliacaoVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Avaliacao routeId={id} />;
}
