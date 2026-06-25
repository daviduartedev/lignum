import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-zinc-50 p-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Página não encontrada</h1>
      <p className="text-sm text-zinc-600">O endereço que procura não existe ou foi movido.</p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
