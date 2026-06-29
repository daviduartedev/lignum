"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { apiFetch } from "@/lib/apiClient";
import { ASSIGNABLE_ROLES, roleLabel } from "@/lib/roleLabels";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
};

export function EditUsuarioForm({ user }: { user: UserRow }) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim() || null,
          role,
          isActive,
        }),
      });
      toast.success("Utilizador actualizado.");
      router.refresh();
    } catch (err) {
      toast.apiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setResetting(true);
    try {
      await apiFetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      toast.success("Senha redefinida; sessões revogadas.");
      setPassword("");
    } catch (err) {
      toast.apiError(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="border border-border/80 p-6 shadow-sm">
        <form className="space-y-4" onSubmit={(e) => void saveProfile(e)}>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eu-name">Nome</Label>
            <Input id="eu-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label htmlFor="eu-active">Conta activa</Label>
              <p className="text-xs text-muted-foreground">Desactivar revoga sessões existentes.</p>
            </div>
            <Switch id="eu-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="bg-[#22C55E] hover:bg-[#16A34A] text-white">
              {submitting ? "A guardar…" : "Guardar alterações"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/configuracoes/usuarios">Cancelar</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border border-border/80 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-medium">Redefinir senha</h2>
          <p className="text-xs text-muted-foreground">Nova senha definida pelo administrador.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eu-password">Nova senha</Label>
          <Input
            id="eu-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <Button type="button" variant="secondary" disabled={resetting} onClick={() => void resetPassword()}>
          {resetting ? "A redefinir…" : "Redefinir senha"}
        </Button>
      </Card>
    </div>
  );
}
