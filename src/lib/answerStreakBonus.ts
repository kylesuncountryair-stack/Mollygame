import { prisma } from "@/lib/prisma";

// Every Nth consecutive correct answer (in submission order, across DAILY,
// WEEKLY, and BONUS questions alike) earns a bonus — 10, 20, 30, and so on.
// A single wrong answer resets the streak back to zero.
export const STREAK_BONUS_INTERVAL = 10;
export const STREAK_BONUS_AMOUNT = 3;

export type StreakBonusResult = { count: number; bonus: number } | null;

// Call this right after recording a correct answer. Walks the player's
// answers newest-first and counts how many consecutive ones (including the
// one just recorded) are correct. Only the small dataset size of a one-month
// game makes a full scan like this reasonable — no need for a running
// counter column.
export async function tryTriggerStreakBonus(userId: string): Promise<StreakBonusResult> {
  const answers = await prisma.answer.findMany({
    where: { userId },
    orderBy: { answeredAt: "desc" },
    select: { isCorrect: true },
  });

  let count = 0;
  for (const a of answers) {
    if (!a.isCorrect) break;
    count++;
  }

  if (count === 0 || count % STREAK_BONUS_INTERVAL !== 0) return null;

  await prisma.logTransaction.create({
    data: {
      userId,
      amount: STREAK_BONUS_AMOUNT,
      reason: `${count} correct answers in a row!`,
      type: "STREAK_BONUS",
    },
  });

  return { count, bonus: STREAK_BONUS_AMOUNT };
}
