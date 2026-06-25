import type { APIResponse } from "@playwright/test";

/** Desempacota `{ success: true, data }` das rotas App Router. */
export async function readApiData<T>(res: APIResponse): Promise<T> {
  const j = (await res.json()) as unknown;
  if (!res.ok()) {
    throw new Error(`HTTP ${res.status()}: ${JSON.stringify(j)}`);
  }
  if (typeof j === "object" && j !== null && "success" in j && (j as { success: boolean }).success === true) {
    return (j as unknown as { data: T }).data;
  }
  throw new Error(`Resposta inesperada: ${JSON.stringify(j)}`);
}
