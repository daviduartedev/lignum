import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DocumentosPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Os documentos de clientes ficam no prontuário de cada cadastro (contratos, anexos e links externos).
        </p>
      </div>

      <Card className="p-6 border border-border">
        <p className="text-sm text-muted-foreground mb-4">
          Abra a lista de clientes, escolha um cadastro e use a aba <strong>Documentos</strong> para anexar ou
          referenciar ficheiros.
        </p>
        <Button asChild>
          <Link href="/clientes">Ir para clientes</Link>
        </Button>
      </Card>
    </div>
  );
}
