const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function jstMidnight(d: Date): Date {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - JST_OFFSET_MS);
}

/** Returns YYYY-MM-DD in JST. */
export function jstYmd(d: Date): string {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the JST midnight of the Sunday on or before the given date. */
export function weekStart(d: Date): Date {
  const mid = jstMidnight(d);
  const jstDow = new Date(mid.getTime() + JST_OFFSET_MS).getUTCDay();
  return new Date(mid.getTime() - jstDow * DAY_MS);
}

/** 7 sequential JST midnights starting from `start` (Sun). */
export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
}

/**
 * Returns N*7 dates representing N weeks of grid for the month containing `ref`.
 * Starts from the Sunday of the week containing day 1.
 */
export function monthGridSlots(ref: Date, weeks: number): Date[] {
  const jst = new Date(ref.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const firstUtc = new Date(Date.UTC(year, month, 1, 0, 0, 0)).getTime() - JST_OFFSET_MS;
  const start = weekStart(new Date(firstUtc));
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
}
