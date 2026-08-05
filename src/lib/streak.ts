import { startOfTodayCT } from "@/lib/bonfire";

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Consecutive-SCHEDULED-day streak of correctly-answered DAILY questions,
// based on each question's calendar day (activeDate), not the exact time it
// was answered.
//
// Daily questions aren't scheduled every single calendar day (there might
// be a handful a week, with gaps in between), so the streak walks backward
// through the distinct days that actually HAD a daily question, skipping
// over the days with no question at all, rather than requiring every raw
// calendar day in a row to have one. E.g. if questions only ever run
// Mon/Wed/Fri and a player answers all three correctly, that's a 3-day
// streak — the Tue/Thu gaps don't count against them.
//
// The most recently scheduled day gets a grace period if it hasn't been
// answered correctly yet: it doesn't break an existing streak, since (a) a
// daily question stays open/answerable until the next one is scheduled
// (see getActiveDailyQuestions), and (b) if it IS today's question, there's
// still time left today to answer it (Duolingo-style grace period).
export function computeStreak(scheduledDailyDates: Date[], correctDailyDates: Date[], today = new Date()): number {
  const todayKey = dateKey(startOfTodayCT(today));

  const scheduledKeys = [...new Set(scheduledDailyDates.map(dateKey))]
    .filter((k) => k <= todayKey)
    .sort()
    .reverse(); // most recent first
  if (scheduledKeys.length === 0) return 0;

  const correctKeys = new Set(correctDailyDates.map(dateKey));

  let idx = 0;
  if (!correctKeys.has(scheduledKeys[0])) idx = 1; // grace period on the most recent scheduled day

  let streak = 0;
  for (; idx < scheduledKeys.length; idx++) {
    if (!correctKeys.has(scheduledKeys[idx])) break;
    streak++;
  }
  return streak;
}
