import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function UsuariosPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.admin, Role.authenticated, Role.public, Role.sales, Role.finance, Role.read_only],
      },
    },
    orderBy: { id: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Usuários</h1>
          <p className="text-sm text-[#6B7280]">Contas com acesso ao sistema</p>
        </div>
        <Button asChild className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
          <Link href="/configuracoes/usuarios/novo">Novo usuário</Link>
        </Button>
      </div>

      <Card className="overflow-hidden border border-border/80 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border/60">
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.name ?? "-"}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.createdAt.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/configuracoes">← Voltar às configurações</Link>
      </Button>
    </div>
  );
}
