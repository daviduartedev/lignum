import { AvaliacaoCompra } from "@/components/avaliacao/AvaliacaoCompra";

export default async function AvaliacaoCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AvaliacaoCompra routeId={id} />;
}
