"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, Trash2, Upload } from "lucide-react";
import {
  useClientDocuments,
  useCreateClientDocument,
  useDeleteClientDocument,
} from "@/hooks/useClientDocuments";
import { uploadStaffFiles } from "@/services/internal/staffUpload";
import { toast } from "@/lib/toast";

type ClientDocumentsSectionProps = {
  clientId: number;
};

export function ClientDocumentsSection({ clientId }: ClientDocumentsSectionProps) {
  const { data, isLoading } = useClientDocuments(clientId);
  const createMutation = useCreateClientDocument();
  const deleteMutation = useDeleteClientDocument();
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const documents = data?.documents ?? [];

  const handleAdd = async (documentFileUrl?: string) => {
    const t = title.trim();
    if (!t) {
      toast.error("Informe o título do documento.");
      return;
    }
    const url = externalUrl.trim();
    if (!documentFileUrl && !url) {
      toast.error("Envie um ficheiro ou informe uma URL externa.");
      return;
    }
    await createMutation.mutateAsync({
      title: t,
      clientId,
      externalUrl: url || undefined,
      documentFileUrl,
    });
    setTitle("");
    setExternalUrl("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const [url] = await uploadStaffFiles([file]);
      await handleAdd(url);
    } catch (err: unknown) {
      toast.apiError(err);
    } finally {
      setUploading(false);
    }
  };

  const busy = createMutation.isPending || deleteMutation.isPending || uploading;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#111827]">Documentos anexos</h3>
        <p className="text-xs text-muted-foreground mt-1">
          CNH, comprovantes ou contratos — ficheiro (upload) ou link externo.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando documentos…
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border">
          {documents.map((doc) => {
            const href = doc.documentFileUrl || doc.externalUrl;
            return (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  {doc.notes ? <p className="text-xs text-muted-foreground truncate">{doc.notes}</p> : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {href ? (
                    <Button type="button" variant="ghost" size="sm" asChild>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    disabled={busy}
                    onClick={() => deleteMutation.mutate({ id: doc.id, clientId })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-3 border-t pt-4">
        <div className="grid gap-2">
          <Label htmlFor="client-doc-title">Título *</Label>
          <Input
            id="client-doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: CNH, Comprovante de residência"
            disabled={busy}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client-doc-url">URL externa (opcional)</Label>
          <Input
            id="client-doc-url"
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://…"
            disabled={busy}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || !title.trim()}
            onClick={() => void handleAdd()}
          >
            Salvar com URL
          </Button>
          <Label className="inline-flex items-center gap-2 cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={busy || !title.trim()} asChild>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                Enviar ficheiro
              </span>
            </Button>
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              disabled={busy || !title.trim()}
              onChange={(e) => void handleFileChange(e)}
            />
          </Label>
        </div>
      </div>
    </Card>
  );
}
