import { apiFetch } from "@/lib/apiClient";
import type { InboxSummaryPayload } from "@/lib/inbox/buildInboxSummary";

export async function fetchInboxSummary(): Promise<InboxSummaryPayload> {
  return apiFetch<InboxSummaryPayload>("/api/inbox/summary");
}

export async function fetchUserInboxPreferences(): Promise<{ showDashboardAttentionStripe: boolean }> {
  return apiFetch<{ showDashboardAttentionStripe: boolean }>("/api/user/inbox-preferences");
}

export async function saveUserInboxPreferences(body: {
  showDashboardAttentionStripe: boolean;
}): Promise<{ showDashboardAttentionStripe: boolean }> {
  return apiFetch<{ showDashboardAttentionStripe: boolean }>("/api/user/inbox-preferences", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
