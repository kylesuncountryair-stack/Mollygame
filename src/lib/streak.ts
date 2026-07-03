import { startOfTodayUTC } from "@/lib/bonfire";

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// Consecutive-day streak of correctly-answered DAILY questions, based on the
// question's calendar day (activeDate), not the exact time it was answered.
// If today's daily question hasn't been answered correctly yet, that's not
// treated as "broken" — the streak still counts through yesterday, since
// there's still time today to extend it (Duolingo-style grace period).
export function computeStreak(correctDailyActiveDates: Date[], today = new Date()): number {
  const dates = new Set(correctDailyActiveDates.map((d) => dateKey(d)));

  let cursor = startOfTodayUTC(today);
  if (!dates.has(dateKey(cursor))) {
    cursor = addDaysUTC(cursor, -1);
  }

  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak++;
    cursor = addDaysUTC(cursor, -1);
  }
  return streak;
}
