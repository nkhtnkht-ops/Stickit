import { describe, it, expect } from "vitest";
import { todayRange, tomorrowRange, next7DaysRange } from "@/utils/dateRange";

describe("dateRange (JST)", () => {
  const ref = new Date("2026-05-13T03:00:00Z"); // JST 12:00 noon

  it("todayRange covers JST 00:00-24:00", () => {
    const { from, to } = todayRange(ref);
    expect(from.toISOString()).toBe("2026-05-12T15:00:00.000Z"); // JST 00:00
    expect(to.toISOString()).toBe("2026-05-13T15:00:00.000Z");   // 翌JST 00:00
  });

  it("tomorrowRange covers next JST day", () => {
    const { from, to } = tomorrowRange(ref);
    expect(from.toISOString()).toBe("2026-05-13T15:00:00.000Z");
    expect(to.toISOString()).toBe("2026-05-14T15:00:00.000Z");
  });

  it("next7DaysRange covers 7 days from today", () => {
    const { from, to } = next7DaysRange(ref);
    expect(from.toISOString()).toBe("2026-05-12T15:00:00.000Z");
    expect(to.toISOString()).toBe("2026-05-19T15:00:00.000Z");
  });
});
