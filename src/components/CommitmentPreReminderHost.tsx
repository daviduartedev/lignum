"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { toast as rt } from "react-toastify";
import { useInboxSummary } from "@/hooks/useInboxSummary";
import { emitPreCommitmentToastShown } from "@/lib/postLoginNotificacoesTelemetry";

const ACK_PREFIX = "lignum_pre_commit_ack";

export function CommitmentPreReminderHost() {
  const { status } = useSession();
  const { data, refetch, dataUpdatedAt } = useInboxSummary(status === "authenticated");
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "authenticated") return;
    const t = setInterval(() => {
      void refetch();
    }, 60_000);
    return () => clearInterval(t);
  }, [status, refetch]);

  useEffect(() => {
    if (!data?.commitmentsInPreWindow?.length) return;
    if (typeof window === "undefined") return;

    for (const c of data.commitmentsInPreWindow) {
      const key = `${ACK_PREFIX}_${c.id}`;
      if (sessionStorage.getItem(key) === "1") continue;
      if (shownRef.current.has(c.id)) continue;
      shownRef.current.add(c.id);
      emitPreCommitmentToastShown(c.id);
      const when = new Date(c.remindAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      const tid = rt.info(
        <div className="text-sm pr-6 max-w-xs">
          <p className="font-semibold text-foreground">Compromisso aproxima-se</p>
          <p className="mt-1 text-muted-foreground leading-snug">{c.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">Às {when}</p>
          <button
            type="button"
            className="mt-3 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            onClick={() => {
              sessionStorage.setItem(key, "1");
              rt.dismiss(tid);
            }}
          >
            OK
          </button>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          position: "top-right",
          onClose: () => {
            sessionStorage.setItem(key, "1");
          },
        },
      );
    }
  }, [data, dataUpdatedAt]);

  return null;
}
