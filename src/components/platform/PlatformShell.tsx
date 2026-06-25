"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <header className="flex shrink-0 items-center justify-between border-b border-border/80 bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <BrandLogo className="relative h-10 w-28 shrink-0" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plataforma</p>
            <h1 className="text-lg font-semibold text-foreground">Gestão de lojas</h1>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 size-4" />
          Sair
        </Button>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-6 pb-10">{children}</main>
    </div>
  );
}
