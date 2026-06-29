import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EditUsuarioForm } from "./EditUsuarioForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditarUsuarioPage({ params }: Props) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;
  const num = Number.parseInt(id, 10);
  if (!Number.isInteger(num) || num <= 0) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: num },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Editar usuário</h1>
        <p className="text-sm text-[#6B7280]">{user.email}</p>
      </div>
      <EditUsuarioForm user={user} />
      <Button variant="outline" asChild>
        <Link href="/configuracoes/usuarios">← Voltar à lista</Link>
      </Button>
    </div>
  );
}
