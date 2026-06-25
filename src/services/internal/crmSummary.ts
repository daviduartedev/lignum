import { apiFetch } from "@/lib/apiClient";

export type CrmSummary = {
  totalClients: number;
  clientsNewThisMonth: number;
  clientsActiveLast6Months: number;
  totalSuppliers: number;
};

export async function fetchCrmSummary(): Promise<CrmSummary> {
  return apiFetch<CrmSummary>("/api/crm-summary");
}
