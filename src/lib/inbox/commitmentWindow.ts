/** Notificações não lidas com `remindAt` dentro da janela [agora, agora + preMinutes]. */
export function listCommitmentsInPreWindow(
  now: Date,
  preMinutes: number,
  rows: { id: number; read: boolean; remindAt: Date | null; title: string }[],
): { id: string; title: string; remindAt: string }[] {
  const windowMs = Math.max(1, preMinutes) * 60 * 1000;
  const t0 = now.getTime();

  return rows
    .filter((r) => !r.read && r.remindAt != null)
    .filter((r) => {
      const t = r.remindAt!.getTime();
      return t > t0 && t - t0 <= windowMs;
    })
    .map((r) => ({
      id: String(r.id),
      title: r.title,
      remindAt: r.remindAt!.toISOString(),
    }));
}
