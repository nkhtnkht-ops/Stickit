import { describe, it, expect } from "vitest";
import { weekStart, weekDays, monthGridSlots, jstYmd } from "@/utils/calendar";

describe("calendar utils (JST)", () => {
  // Reference: 2026-05-13 Wed (JST 12:00) = 2026-05-13T03:00:00Z
  const ref = new Date("2026-05-13T03:00:00Z");

  it("weekStart returns the previous Sunday at JST 00:00", () => {
    const ws = weekStart(ref);
    expect(jstYmd(ws)).toBe("2026-05-10");
  });

  it("weekDays returns 7 dates Sun..Sat", () => {
    const days = weekDays(weekStart(ref));
    expect(days).toHaveLength(7);
    expect(jstYmd(days[0])).toBe("2026-05-10");
    expect(jstYmd(days[6])).toBe("2026-05-16");
  });

  it("monthGridSlots(ref, 6) returns 42 days starting from week containing 5/1", () => {
    const slots = monthGridSlots(ref, 6);
    expect(slots).toHaveLength(42);
    // First day: previous Sunday relative to 5/1 = 4/26
    expect(jstYmd(slots[0])).toBe("2026-04-26");
    // Day index 17 = 5/13 (today)
    expect(jstYmd(slots[17])).toBe("2026-05-13");
  });

  it("jstYmd formats UTC date as JST YYYY-MM-DD", () => {
    expect(jstYmd(new Date("2026-05-13T15:00:00Z"))).toBe("2026-05-14");
    expect(jstYmd(new Date("2026-05-13T14:59:00Z"))).toBe("2026-05-13");
  });
});
