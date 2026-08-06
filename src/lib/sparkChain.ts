import { prisma } from "@/lib/prisma";

export const SPARK_CHAIN_BONUS = 1;

export type SparkChainResult = { friendName: string; bonus: number } | null;

// Call this right after recording a correct answer. If any of the player's
// circle (people they follow) also answered THIS SAME QUESTION correctly,
// and this exact pair hasn't already sparked on this question, both players
// get a small bonus log — a lightweight nudge to remind coworkers to play
// together rather than solo.
//
// Matched on the question itself rather than the calendar day: daily
// questions aren't scheduled every day (they carry forward until the next
// one is scheduled — see getActiveDailyQuestions), so two coworkers can
// easily end up answering the same question a day or two apart depending
// on their schedule. Matching on the question means that still counts.
//
// Capped at one spark per player per question (checked for BOTH sides of
// the pair) so it can't be farmed by following a lot of people, and isn't a
// bigger reward than the questions themselves.
export async function tryTriggerSparkChain(userId: string, questionId: string): Promise<SparkChainResult> {
  const alreadySparked = await prisma.sparkChain.findFirst({
    where: { questionId, OR: [{ userAId: userId }, { userBId: userId }] },
  });
  if (alreadySparked) return null;

  const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  if (following.length === 0) return null;
  const friendIds = following.map((f) => f.followingId);

  // Ordered by answeredAt ascending (combined with `distinct`, Prisma keeps
  // each user's EARLIEST qualifying row) so that when more than one circle
  // member already answered this question correctly, the spark
  // deterministically goes to whoever played it first — not an arbitrary
  // database order.
  const friendCorrectAnswers = await prisma.answer.findMany({
    where: { userId: { in: friendIds }, questionId, isCorrect: true },
    select: { userId: true },
    distinct: ["userId"],
    orderBy: { answeredAt: "asc" },
  });
  if (friendCorrectAnswers.length === 0) return null;

  for (const { userId: friendId } of friendCorrectAnswers) {
    const friendAlreadySparked = await prisma.sparkChain.findFirst({
      where: { questionId, OR: [{ userAId: friendId }, { userBId: friendId }] },
    });
    if (friendAlreadySparked) continue; // this friend already used their spark on this question — try the next one

    const [userAId, userBId] = [userId, friendId].sort();
    try {
      await prisma.sparkChain.create({ data: { userAId, userBId, questionId } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002") continue; // race: this pair already sparked on this question, try the next candidate
      throw e;
    }

    const friend = await prisma.user.findUnique({ where: { id: friendId }, select: { name: true } });

    await prisma.$transaction([
      prisma.logTransaction.create({
        data: {
          userId,
          amount: SPARK_CHAIN_BONUS,
          reason: `Spark chain with ${friend?.name ?? "a friend"}`,
          type: "SPARK_CHAIN",
        },
      }),
      prisma.logTransaction.create({
        data: { userId: friendId, amount: SPARK_CHAIN_BONUS, reason: "Spark chain", type: "SPARK_CHAIN" },
      }),
    ]);

    return { friendName: friend?.name ?? "a friend", bonus: SPARK_CHAIN_BONUS };
  }

  return null;
}

// One-time (but safe to re-run) reconciliation for the switch from
// day-based to question-based spark matching. Replays every correct answer
// ever submitted, in the order it originally happened, through the same
// tryTriggerSparkChain logic above — so any pair who would have sparked
// under the new "same question" rule, but didn't because they answered on
// different days (or the old day-based cap got in the way), gets their
// spark retroactively. Already-sparked pairs/questions are skipped via the
// same uniqueness checks used for live sparks, so running this more than
// once won't double-award anything.
export async function backfillSparkChains(): Promise<{ checked: number; created: number }> {
  const answers = await prisma.answer.findMany({
    where: { isCorrect: true },
    orderBy: { answeredAt: "asc" },
    select: { userId: true, questionId: true },
  });

  let created = 0;
  for (const a of answers) {
    const result = await tryTriggerSparkChain(a.userId, a.questionId);
    if (result) created++;
  }

  return { checked: answers.length, created };
}
