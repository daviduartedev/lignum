"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { POLICY_PRIVACY_VERSION } from "@/lib/lgpdPolicyMeta";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NovoUsuarioForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "sales" | "finance" | "read_only">("sales");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("É necessário aceitar a política de privacidade.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          role,
          lgpdConsentVersion: POLICY_PRIVACY_VERSION,
        }),
      });
      toast.success("Usuário criado com sucesso.");
      router.push("/configuracoes/usuarios");
      router.refresh();
    } catch (err) {
      toast.apiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg border border-border/80 p-6 shadow-sm">
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-2">
          <Label htmlFor="nu-email">E-mail</Label>
          <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nu-password">Senha (mín. 8 caracteres)</Label>
          <Input
            id="nu-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nu-name">Nome (opcional)</Label>
          <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "admin" | "sales" | "finance" | "read_only")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Vendedor</SelectItem>
              <SelectItem value="finance">Financeiro</SelectItem>
              <SelectItem value="read_only">Somente leitura</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-border/60 p-3">
          <Checkbox id="nu-lgpd" checked={accepted} onCheckedChange={(c) => setAccepted(c === true)} />
          <Label htmlFor="nu-lgpd" className="text-sm font-normal leading-snug cursor-pointer">
            Li e aceito a{" "}
            <Link href="/politica-privacidade" className="text-emerald-700 underline" target="_blank">
              política de privacidade
            </Link>{" "}
            (versão {POLICY_PRIVACY_VERSION}).
          </Label>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={submitting} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
            {submitting ? "Criando…" : "Criar usuário"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/configuracoes/usuarios">Cancelar</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}
