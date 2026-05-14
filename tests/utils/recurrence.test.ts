import { describe, it, expect } from "vitest";
import { nextOccurrence, RECURRENCE_PRESETS } from "@/utils/recurrence";

describe("recurrence", () => {
  // Reference: 2026-05-13 Wed 10:30 JST = 2026-05-13T01:30:00Z
  const ref = new Date("2026-05-13T01:30:00Z");

  it("daily preset → next is 2026-05-14 same time", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.daily, ref);
    expect(next?.toISOString()).toBe("2026-05-14T01:30:00.000Z");
  });

  it("weekly preset → next is 2026-05-20 same time (next Wed)", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.weekly, ref);
    expect(next?.toISOString()).toBe("2026-05-20T01:30:00.000Z");
  });

  it("monthly preset → next is 2026-06-13 same time", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.monthly, ref);
    expect(next?.toISOString()).toBe("2026-06-13T01:30:00.000Z");
  });

  it("weekdays preset (5/13 Wed) → next is 2026-05-14 (Thu)", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.weekdays, ref);
    expect(next?.toISOString()).toBe("2026-05-14T01:30:00.000Z");
  });

  it("weekdays preset (5/15 Fri) → next is 2026-05-18 (Mon, skips Sat/Sun)", () => {
    const fri = new Date("2026-05-15T01:30:00Z");
    const next = nextOccurrence(RECURRENCE_PRESETS.weekdays, fri);
    expect(next?.toISOString()).toBe("2026-05-18T01:30:00.000Z");
  });

  it("returns null for invalid rule", () => {
    expect(nextOccurrence("invalid", ref)).toBeNull();
  });

  it("returns null for empty rule", () => {
    expect(nextOccurrence("", ref)).toBeNull();
    expect(nextOccurrence(null as unknown as string, ref)).toBeNull();
  });
});
