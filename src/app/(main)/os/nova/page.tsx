import { OSForm } from "@/components/operacao/OSForm";

export default async function NovaOsPage({
  searchParams,
}: {
  searchParams: Promise<{ veiculo?: string }>;
}) {
  const sp = await searchParams;
  return <OSForm veiculoInicial={sp.veiculo} />;
}
