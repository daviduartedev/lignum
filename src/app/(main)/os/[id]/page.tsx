import { OSForm } from "@/components/operacao/OSForm";

export default async function OsDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  return <OSForm routeId={id} modoInicial={sp.modo} />;
}
