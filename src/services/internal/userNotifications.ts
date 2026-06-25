import { apiFetch, apiFetchPaginated } from "@/lib/apiClient";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import type { UserNotification } from "@/types";

function mapRow(r: Record<string, unknown>): UserNotification {
  const remind = r.remindAt;
  let remindAt: string | undefined;
  if (remind instanceof Date) {
    remindAt = remind.toISOString();
  } else if (remind != null && String(remind).length > 0) {
    remindAt = String(remind);
  }
  const created =
    r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? "");

  return {
    id: String(r.id),
    documentId: (r.documentId as string) ?? undefined,
    title: String(r.title ?? ""),
    body: String(r.body ?? ""),
    read: Boolean(r.read),
    link: r.link != null ? String(r.link) : undefined,
    remind_at: remindAt,
    createdAt: created,
  };
}

export async function fetchAllUserNotifications(): Promise<UserNotification[]> {
  const rows = await apiFetch<Record<string, unknown>[]>("/api/user-notifications?all=1");
  return rows.map(mapRow);
}

export type NotificationSummary = { total: number; unread: number; read: number };

export async function fetchUserNotificationSummary(): Promise<NotificationSummary> {
  return apiFetch<NotificationSummary>("/api/user-notifications/summary");
}

export async function fetchUserNotificationsPage(
  page: number,
  opts?: { pageSize?: number; read?: "all" | "true" | "false" },
): Promise<{ items: UserNotification[]; meta: PaginationMeta }> {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const read = opts?.read ?? "all";
  let url = `/api/user-notifications?page=${page}&pageSize=${pageSize}`;
  if (read === "true" || read === "false") url += `&read=${read}`;
  const { data, meta } = await apiFetchPaginated<Record<string, unknown>>(url);
  return { items: data.map(mapRow), meta };
}

export async function updateNotificationRead(id: string, read: boolean): Promise<void> {
  await apiFetch<Record<string, unknown>>(`/api/user-notifications/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ read }),
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch<{ id: number }>(`/api/user-notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createUserNotification(payload: {
  title: string;
  body?: string;
  remindAt?: string | null;
  link?: string;
  ownerUserId: number;
}): Promise<UserNotification> {
  const row = await apiFetch<Record<string, unknown>>("/api/user-notifications", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      body: payload.body ?? "",
      remindAt: payload.remindAt ?? null,
      link: payload.link,
      ownerUserId: payload.ownerUserId,
    }),
  });
  return mapRow(row);
}
