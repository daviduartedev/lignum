import { apiFetch } from "@/lib/apiClient";

/** Envia ficheiros para `POST /api/upload` e devolve URLs públicas HTTPS. */
export async function uploadStaffFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const data = await apiFetch<{ urls: string[] }>("/api/upload", {
    method: "POST",
    body: form,
  });
  return data.urls;
}
