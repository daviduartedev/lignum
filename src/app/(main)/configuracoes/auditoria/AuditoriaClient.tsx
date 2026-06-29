"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AuditAction } from "@prisma/client";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuditRow = {
  id: number;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  user: { id: number; email: string; name: string | null } | null;
};

export function AuditoriaClient() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (userId.trim()) params.set("userId", userId.trim());
      if (action.trim()) params.set("action", action.trim());
      if (resourceType.trim()) params.set("resourceType", resourceType.trim());
      const data = await apiFetch<AuditRow[]>(`/api/audit-logs?${params.toString()}`);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId, action, resourceType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <Card className="p-4 border border-border/80 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="af-user">ID utilizador</Label>
          <Input id="af-user" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="af-action">Acção</Label>
          <Input id="af-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="ex. user_created" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="af-resource">Tipo recurso</Label>
          <Input
            id="af-resource"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            placeholder="ex. user"
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Aplicar filtros
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden border border-border/80 shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">A carregar…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Acção</th>
                <th className="px-4 py-3 font-medium">Utilizador</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum registo encontrado.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
                    <td className="px-4 py-3">{r.user?.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.resourceType}
                      {r.resourceId ? ` #${r.resourceId}` : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      <Button variant="outline" asChild>
        <Link href="/configuracoes/usuarios">← Utilizadores</Link>
      </Button>
    </div>
  );
}
