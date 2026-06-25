import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { POLICY_PRIVACY_EFFECTIVE_DATE, POLICY_PRIVACY_VERSION } from "@/lib/lgpdPolicyMeta";

function loadMarkdown(): string {
  const candidates = [
    path.join(process.cwd(), "..", "docs", "lgpd", "politica-privacidade.md"),
    path.join(process.cwd(), "docs", "lgpd", "politica-privacidade.md"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, "utf8");
      }
    } catch {
      /* continua */
    }
  }
  return "# Política de privacidade\n\nFicheiro `docs/lgpd/politica-privacidade.md` não encontrado neste ambiente de build.";
}

export default function PoliticaPrivacidadePage() {
  const raw = loadMarkdown();
  const dpoFromEnv = process.env.NEXT_PUBLIC_DPO_EMAIL?.trim() || "";
  const content = raw.replace(/\[EMAIL_DPO\]/g, dpoFromEnv || "[EMAIL_DPO]");

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-gradient-to-b from-muted/40 via-background to-background text-foreground">
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Link>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50 text-primary shadow-sm">
                <Shield className="size-6" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Última atualização · v{POLICY_PRIVACY_VERSION}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Política de privacidade
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">Vigência a partir de {POLICY_PRIVACY_EFFECTIVE_DATE}</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{content}</pre>
      </article>
    </div>
  );
}
