import { describe, expect, it } from "vitest";
import { listCommitmentsInPreWindow } from "@/lib/inbox/commitmentWindow";

describe("listCommitmentsInPreWindow", () => {
  const t0 = new Date("2026-04-21T12:00:00.000Z");

  it("includes unread notifications whose remindAt is within the window", () => {
    const rows = [
      { id: 1, read: false, remindAt: new Date("2026-04-21T12:20:00.000Z"), title: "A" },
      { id: 2, read: true, remindAt: new Date("2026-04-21T12:15:00.000Z"), title: "B" },
    ];
    const out = listCommitmentsInPreWindow(t0, 30, rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("1");
  });

  it("excludes reminders already in the past", () => {
    const rows = [{ id: 3, read: false, remindAt: new Date("2026-04-21T11:00:00.000Z"), title: "Past" }];
    expect(listCommitmentsInPreWindow(t0, 30, rows)).toHaveLength(0);
  });

  it("excludes reminders beyond the window", () => {
    const rows = [{ id: 4, read: false, remindAt: new Date("2026-04-21T13:00:00.000Z"), title: "Far" }];
    expect(listCommitmentsInPreWindow(t0, 30, rows)).toHaveLength(0);
  });
});
