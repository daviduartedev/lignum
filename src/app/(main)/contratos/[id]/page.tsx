import { ContratoForm } from "@/components/operacao/ContratoForm";

export default async function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContratoForm routeId={id} />;
}
