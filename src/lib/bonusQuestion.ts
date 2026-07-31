import { prisma } from "@/lib/prisma";
import { startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";

// Bonus questions always award this many logs, regardless of their own
// logsReward column — enforced both in the admin form and here.
export const BONUS_LOGS_REWARD = 3;

// The player who was first (by answeredAt, within today's Central-time
// window) to answer the given DAILY question, or null if nobody has yet.
async function getFirstAnswererToday(dailyQuestionId: string): Promise<string | null> {
  const firstAnswer = await prisma.answer.findFirst({
    where: { questionId: dailyQuestionId, answeredAt: { gte: startOfTodayCT(), lt: endOfTodayCT() } },
    orderBy: { answeredAt: "asc" },
    select: { userId: true },
  });
  return firstAnswer?.userId ?? null;
}

// Whether today has a BONUS question scheduled, and if so, whether this
// user is the one who unlocked it (i.e. was first to answer today's active
// DAILY question). Used by the dashboard to decide whether to render the
// bonus QuestionCard.
export async function getTodaysUnlockedBonusQuestion(userId: string, dailyQuestionId: string | undefined | null) {
  if (!dailyQuestionId) return null;

  const firstAnswererId = await getFirstAnswererToday(dailyQuestionId);
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
  const dailyQuestion = await prisma.question.findFirst({
    where: { type: "DAILY", activeDate: { lt: endOfTodayCT() } },
    orderBy: [{ activeDate: "desc" }, { createdAt: "desc" }],
  });
  if (!dailyQuestion) return false;

  const firstAnswererId = await getFirstAnswererToday(dailyQuestion.id);
  return firstAnswererId === userId;
}
