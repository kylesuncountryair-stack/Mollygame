import { prisma } from "@/lib/prisma";
import { startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";
import { getActiveDailyQuestions } from "@/lib/dailyQuestions";

// Bonus questions always award this many logs, regardless of their own
// logsReward column — enforced both in the admin form and here.
export const BONUS_LOGS_REWARD = 3;

// The player who was first (by answeredAt, within today's Central-time
// window) to answer ANY of today's active DAILY questions — there can be
// more than one scheduled for the same day, and whichever one someone
// answers first still counts for the race.
async function getFirstAnswererToday(dailyQuestionIds: string[]): Promise<string | null> {
  if (dailyQuestionIds.length === 0) return null;

  const firstAnswer = await prisma.answer.findFirst({
    where: { questionId: { in: dailyQuestionIds }, answeredAt: { gte: startOfTodayCT(), lt: endOfTodayCT() } },
    orderBy: { answeredAt: "asc" },
    select: { userId: true },
  });
  return firstAnswer?.userId ?? null;
}

// Whether today has a BONUS question scheduled, and if so, whether this
// user is the one who unlocked it (i.e. was first to answer any of today's
// active DAILY questions). Used by the dashboard to decide whether to
// render the bonus QuestionCard.
export async function getTodaysUnlockedBonusQuestion(userId: string) {
  const dailyQuestions = await getActiveDailyQuestions();
  if (dailyQuestions.length === 0) return null;

  const firstAnswererId = await getFirstAnswererToday(dailyQuestions.map((q) => q.id));
  if (!firstAnswererId || firstAnswererId !== userId) return null;

  return prisma.question.findFirst({
    where: { type: "BONUS", activeDate: { gte: startOfTodayCT(), lt: endOfTodayCT() } },
    orderBy: { createdAt: "desc" },
  });
}

// Server-side re-check used by the answer API before letting someone submit
// an answer to a BONUS question, so the "first place only" rule can't be
// bypassed by directly POSTing a known bonus question id.
export async function isEligibleForBonusQuestion(userId: string): Promise<boolean> {
  const dailyQuestions = await getActiveDailyQuestions();
  if (dailyQuestions.length === 0) return false;

  const firstAnswererId = await getFirstAnswererToday(dailyQuestions.map((q) => q.id));
  return firstAnswererId === userId;
}
