"use client";

import type { ReactNode } from "react";
import { CommitmentPreReminderHost } from "@/components/CommitmentPreReminderHost";
import { PostLoginNotificacoesGate } from "@/components/PostLoginNotificacoesGate";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-hidden bg-muted/40">
      <PostLoginNotificacoesGate />
      <CommitmentPreReminderHost />
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-8 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
