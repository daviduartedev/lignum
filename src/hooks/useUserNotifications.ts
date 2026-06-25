"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "@/lib/toast";
import {
  createUserNotification,
  deleteNotification,
  fetchAllUserNotifications,
  fetchUserNotificationSummary,
  fetchUserNotificationsPage,
  updateNotificationRead,
} from "@/services/internal/userNotifications";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { INBOX_SUMMARY_KEY } from "@/hooks/useInboxSummary";

export const USER_NOTIFICATIONS_KEY = ["user-notifications"] as const;

export const USER_NOTIFICATION_SUMMARY_KEY = [...USER_NOTIFICATIONS_KEY, "summary"] as const;

export function useUserNotifications() {
  return useQuery({
    queryKey: USER_NOTIFICATIONS_KEY,
    queryFn: fetchAllUserNotifications,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: USER_NOTIFICATION_SUMMARY_KEY,
    queryFn: fetchUserNotificationSummary,
    staleTime: 15_000,
  });
}

export function useUserNotificationsPage(
  page: number,
  opts?: { read?: "all" | "true" | "false"; pageSize?: number },
) {
  const pageSize = opts?.pageSize ?? DEFAULT_PAGE_SIZE;
  const read = opts?.read ?? "all";
  return useQuery({
    queryKey: [...USER_NOTIFICATIONS_KEY, "page", page, pageSize, read],
    queryFn: () => fetchUserNotificationsPage(page, { pageSize, read }),
    staleTime: 15_000,
    retry: 2,
    placeholderData: (prev) => prev,
  });
}

export function useToggleNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => updateNotificationRead(id, read),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATION_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATION_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
      toast.success("Notificação excluída.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useCreateReminderNotification() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  return useMutation({
    mutationFn: async (payload: { title: string; body?: string; remindAt: string }) => {
      const uid = Number(session?.user?.id);
      if (!Number.isFinite(uid) || uid <= 0) {
        throw new Error("Sessão inválida");
      }
      return createUserNotification({
        title: payload.title,
        body: payload.body,
        remindAt: payload.remindAt,
        ownerUserId: uid,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATION_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
      toast.success("Lembrete criado. Ele aparece no calendário e em Notificações.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const list = await fetchAllUserNotifications();
      const unread = list.filter((n) => !n.read);
      await Promise.all(unread.map((n) => updateNotificationRead(n.id, true)));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: USER_NOTIFICATION_SUMMARY_KEY });
      void qc.invalidateQueries({ queryKey: INBOX_SUMMARY_KEY });
      toast.success("Todas as notificações foram marcadas como lidas.");
    },
    onError: (e: unknown) => toast.apiError(e),
  });
}
