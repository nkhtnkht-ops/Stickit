const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstMidnight(d: Date): Date {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - JST_OFFSET_MS);
}

export function todayRange(now: Date = new Date()) {
  const from = jstMidnight(now);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export function tomorrowRange(now: Date = new Date()) {
  const today = todayRange(now);
  const from = new Date(today.from.getTime() + 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export function next7DaysRange(now: Date = new Date()) {
  const { from } = todayRange(now);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}
