import { apiFetch, apiFetchPaginated, fetchAllPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE, type PaginationMeta } from "@/lib/pagination";

export type PayableRow = {
  id: number;
  documentId: string | null;
  origin: "manual" | "compra_veiculo" | "outro";
  description: string;
  dueDate: string;
  amount: string | number;
  status: "aberta" | "paga" | "vencida" | "cancelada";
  paymentDate: string | null;
  notes: string | null;
  vehicleId: number | null;
  supplierId: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchPayablesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string; origin?: string },
): Promise<{ items: PayableRow[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/payables?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status && opts.status !== "todos") url += `&status=${encodeURIComponent(opts.status)}`;
  if (opts?.origin && opts.origin !== "todos") url += `&origin=${encodeURIComponent(opts.origin)}`;
  const { data, meta } = await apiFetchPaginated<PayableRow>(url);
  return { items: data, meta };
}

export async function fetchAllOpenPayables(): Promise<PayableRow[]> {
  const { data } = await apiFetchPaginated<PayableRow>(`/api/payables?page=1&pageSize=500&status=aberta`);
  return data;
}

export async function fetchAllPayables(): Promise<PayableRow[]> {
  return fetchAllPaginated<PayableRow>((page) => `/api/payables?page=${page}&pageSize=100`);
}

export async function createPayable(body: Record<string, unknown>): Promise<PayableRow> {
  return apiFetch<PayableRow>("/api/payables", { method: "POST", body: JSON.stringify(body) });
}

export async function updatePayable(id: number, body: Record<string, unknown>): Promise<PayableRow> {
  return apiFetch<PayableRow>(`/api/payables/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

/** Confirma o pagamento de uma conta a pagar: marca como `paga` com data de hoje. */
export async function confirmPayablePayment(id: number): Promise<PayableRow> {
  const today = new Date();
  const paymentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return updatePayable(id, { status: "paga", paymentDate });
}
