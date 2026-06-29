import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AuditoriaClient } from "./AuditoriaClient";

export default async function AuditoriaPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Auditoria</h1>
        <p className="text-sm text-[#6B7280]">Registo de acções sensíveis no sistema</p>
      </div>
      <AuditoriaClient />
      <Button variant="outline" asChild>
        <Link href="/configuracoes">← Configurações</Link>
      </Button>
    </div>
  );
}
