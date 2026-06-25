import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NovoUsuarioForm } from "./NovoUsuarioForm";

export default async function NovoUsuarioPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Novo usuário</h1>
        <p className="text-sm text-[#6B7280]">Criação de conta com aceite LGPD registrado.</p>
      </div>
      <NovoUsuarioForm />
      <Button variant="outline" asChild>
        <Link href="/configuracoes/usuarios">← Voltar à lista</Link>
      </Button>
    </div>
  );
}
