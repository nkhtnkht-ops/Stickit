import { RRule } from "rrule";

export const RECURRENCE_PRESETS = {
  daily: "FREQ=DAILY",
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
  yearly: "FREQ=YEARLY",
  weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
} as const;

export type RecurrencePresetKey = keyof typeof RECURRENCE_PRESETS;

export const RECURRENCE_LABELS: Record<RecurrencePresetKey, string> = {
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
  yearly: "毎年",
  weekdays: "平日のみ (月-金)",
};

/**
 * Returns the next occurrence strictly after `after`, or null if rule is invalid/exhausted.
 */
export function nextOccurrence(rule: string, after: Date): Date | null {
  if (!rule) return null;
  try {
    const fullRule = rule.includes("DTSTART")
      ? rule
      : `DTSTART:${formatRRuleDate(after)}\nRRULE:${rule}`;
    const rrule = RRule.fromString(fullRule);
    return rrule.after(after, false);
  } catch {
    return null;
  }
}

function formatRRuleDate(d: Date): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Returns the preset key matching the rule string, or null if it's a custom/unknown rule. */
export function detectPreset(rule: string | null | undefined): RecurrencePresetKey | null {
  if (!rule) return null;
  for (const [k, v] of Object.entries(RECURRENCE_PRESETS)) {
    if (rule === v) return k as RecurrencePresetKey;
  }
  return null;
}
