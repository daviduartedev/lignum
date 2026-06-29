import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mapApiRowToQuote } from "@/lib/mappers/quote";
import type { Quote } from "@/types/quotes";
import type { PricingResult } from "@/lib/quotes/pricingEngine";

export async function fetchQuotesPage(
  page: number,
  opts?: { pageSize?: number; q?: string; status?: string },
): Promise<{ items: Quote[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = opts?.q?.trim();
  let url = `/api/quotes?page=${page}&pageSize=${pageSize}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (opts?.status) url += `&status=${encodeURIComponent(opts.status)}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map(mapApiRowToQuote), meta };
}

export async function fetchQuote(routeId: string): Promise<Quote> {
  const row = await apiFetch<Record<string, unknown>>(`/api/quotes/${encodeURIComponent(routeId)}`);
  return mapApiRowToQuote(row);
}

export async function createQuote(body: Record<string, unknown>): Promise<Quote> {
  const row = await apiFetch<Record<string, unknown>>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapApiRowToQuote(row);
}

export async function updateQuote(routeId: string, body: Record<string, unknown>): Promise<Quote> {
  const row = await apiFetch<Record<string, unknown>>(`/api/quotes/${encodeURIComponent(routeId)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapApiRowToQuote(row);
}

export async function deleteQuote(routeId: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/quotes/${encodeURIComponent(routeId)}`, { method: "DELETE" });
}

export async function calculateQuote(body: Record<string, unknown>): Promise<PricingResult> {
  return apiFetch<PricingResult>("/api/quotes/calculate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function convertQuote(routeId: string): Promise<{ quote: Quote; technicalSheet: Record<string, unknown> }> {
  const res = await apiFetch<{ quote: Record<string, unknown>; technicalSheet: Record<string, unknown> }>(
    `/api/quotes/${encodeURIComponent(routeId)}/convert`,
    { method: "POST" },
  );
  return { quote: mapApiRowToQuote(res.quote), technicalSheet: res.technicalSheet };
}

export function quotePdfUrl(routeId: string): string {
  return `/api/quotes/${encodeURIComponent(routeId)}/pdf`;
}

export function technicalSheetPdfUrl(routeId: string): string {
  return `/api/quotes/${encodeURIComponent(routeId)}/technical-sheet/pdf`;
}
