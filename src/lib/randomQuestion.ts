import { prisma } from "@/lib/prisma";
import { startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import { getActiveDailyQuestions } from "@/lib/dailyQuestions";

// How many players get today's RANDOM question, and how far down the
// leaderboard someone has to be to even be considered — the whole point is
// to level the playing field, so anyone already ranked in the top N is
// excluded from the draw. "Top N" is by rank number, not headcount: if
// there's a tie spanning rank 5 (e.g. three people tied for #5), all of
// them count as "in the top 5" and are excluded, same as the leaderboard
// itself would show them.
export const RANDOM_WINNER_SLOTS = 2;
export const RANDOM_EXCLUDED_TOP_RANKS = 5;

// Tops up any still-open winner slots for a RANDOM question by drawing
// randomly from whoever has answered one of today's DAILY questions
// correctly so far, minus the excluded top-ranked players and anyone
// already picked. Safe to call as often as needed (every dashboard load,
// every correct DAILY answer) since it only ever ADDS winners when slots
// are open — once both slots are filled, this is a no-op, so a pick is
// never revoked or reshuffled after the fact.
async function fillRandomWinnerSlots(questionId: string): Promise<void> {
  const currentCount = await prisma.randomQuestionWinner.count({ where: { questionId } });
  const remainingSlots = RANDOM_WINNER_SLOTS - currentCount;
  if (remainingSlots <= 0) return;

  const dailyQuestions = await getActiveDailyQuestions();
  if (dailyQuestions.length === 0) return;

  const [correctAnswers, leaderboard, existingWinners] = await Promise.all([
    prisma.answer.findMany({
      where: { questionId: { in: dailyQuestions.map((q) => q.id) }, isCorrect: true },
      select: { userId: true },
      distinct: ["userId"],
    }),
    getLeaderboardRows(),
    prisma.randomQuestionWinner.findMany({ where: { questionId }, select: { userId: true } }),
  ]);

  const excludedIds = new Set([
    ...leaderboard.filter((r) => r.rank <= RANDOM_EXCLUDED_TOP_RANKS).map((r) => r.id),
    ...existingWinners.map((w) => w.userId),
  ]);

  const pool = correctAnswers.map((a) => a.userId).filter((id) => !excludedIds.has(id));
  if (pool.length === 0) return;

  // Fisher-Yates shuffle, then take as many as there are open slots.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, remainingSlots);
  if (chosen.length === 0) return;

  await prisma.randomQuestionWinner.createMany({
    data: chosen.map((userId) => ({ questionId, userId })),
    skipDuplicates: true,
  });

  // Guards against the rare case of two concurrent calls topping up slots
  // at the same moment and together overshooting the cap — trims back
  // down to RANDOM_WINNER_SLOTS, keeping whoever was recorded first so an
  // already-notified winner is never the one bumped.
  const total = await prisma.randomQuestionWinner.count({ where: { questionId } });
  if (total > RANDOM_WINNER_SLOTS) {
    const overflow = await prisma.randomQuestionWinner.findMany({
      where: { questionId },
      orderBy: { createdAt: "desc" },
      take: total - RANDOM_WINNER_SLOTS,
    });
    await prisma.randomQuestionWinner.deleteMany({ where: { id: { in: overflow.map((w) => w.id) } } });
  }
}

// Today's RANDOM question, but only returned if this specific user is one
// of the (at most RANDOM_WINNER_SLOTS) players randomly picked for it.
// Called on every dashboard load (like getTodaysUnlockedBonusQuestion) so
// slots keep filling as more people answer correctly over the course of
// the day, and also right after a correct DAILY answer so a fresh winner
// can get an immediate celebration popup.
export async function getTodaysRandomQuestionIfWon(userId: string) {
  const question = await prisma.question.findFirst({
    where: { type: "RANDOM", activeDate: { gte: startOfTodayCT(), lt: endOfTodayCT() } },
    orderBy: { createdAt: "desc" },
  });
  if (!question) return null;

  await fillRandomWinnerSlots(question.id);

  const won = await prisma.randomQuestionWinner.findUnique({
    where: { questionId_userId: { questionId: question.id, userId } },
  });
  return won ? question : null;
}

// Server-side re-check used by the answer API before letting someone
// submit an answer to a RANDOM question, so the "only the picked winners"
// rule can't be bypassed by directly POSTing a known RANDOM question id.
export async function isRandomQuestionWinner(userId: string, questionId: string): Promise<boolean> {
  const won = await prisma.randomQuestionWinner.findUnique({
    where: { questionId_userId: { questionId, userId } },
  });
  return !!won;
}
