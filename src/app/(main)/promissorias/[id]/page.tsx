import { redirect } from "next/navigation";

export default async function PromissoriaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  redirect("/financeiro?tab=receber");
}
