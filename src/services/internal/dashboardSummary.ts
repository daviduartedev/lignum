import { apiFetch } from "@/lib/apiClient";
import type { DashboardSummary } from "@/lib/dashboard/summaryTypes";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/dashboard/summary");
}
