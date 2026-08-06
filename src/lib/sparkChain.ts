import { prisma } from "@/lib/prisma";

export const SPARK_CHAIN_BONUS = 1;

export type SparkChainResult = { friendName: string; bonus: number } | null;

// Call this right after recording a correct answer. If any of the player's
// circle (people they follow) also answered correctly somewhere in this
// SAME ROUND of questions, and this exact pair hasn't already sparked for
// this round, both players get a small bonus log — a lightweight nudge to
// remind coworkers to play together rather than solo.
//
// A "round" is keyed by the question's scheduled activeDate, not the exact
// question and not the day it was actually answered:
//   - Not the exact question, because one round can include more than one
//     question (e.g. two DAILY questions posted the same day, plus that
//     day's BONUS question) — all of those share a round, so answering
//     several of them with the same friend is still just one spark, not
//     one per question.
//   - Not the day it was answered, because daily questions aren't
//     scheduled every day and stay open for a while after (they carry
//     forward until the next round is scheduled — see
//     getActiveDailyQuestions), so two coworkers can easily land on the
//     same round a day or two apart depending on their own schedule, and
//     should still spark.
//
// Capped at one spark per player per round (checked for BOTH sides of the
// pair) so it can't be farmed by following a lot of people, and isn't a
// bigger reward than the questions themselves.
export async function tryTriggerSparkChain(userId: string, questionActiveDate: Date): Promise<SparkChainResult> {
  const alreadySparked = await prisma.sparkChain.findFirst({
    where: { roundDate: questionActiveDate, OR: [{ userAId: userId }, { userBId: userId }] },
  });
  if (alreadySparked) return null;

  const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  if (following.length === 0) return null;
  const friendIds = following.map((f) => f.followingId);

  // Ordered by answeredAt ascending (combined with `distinct`, Prisma keeps
  // each user's EARLIEST qualifying row) so that when more than one circle
  // member already answered correctly in this round, the spark
  // deterministically goes to whoever played first — not an arbitrary
  // database order.
  const friendCorrectAnswers = await prisma.answer.findMany({
    where: { userId: { in: friendIds }, isCorrect: true, question: { activeDate: questionActiveDate } },
    select: { userId: true },
    distinct: ["userId"],
    orderBy: { answeredAt: "asc" },
  });
  if (friendCorrectAnswers.length === 0) return null;

  for (const { userId: friendId } of friendCorrectAnswers) {
    const friendAlreadySparked = await prisma.sparkChain.findFirst({
      where: { roundDate: questionActiveDate, OR: [{ userAId: friendId }, { userBId: friendId }] },
    });
    if (friendAlreadySparked) continue; // this friend already used their spark for this round — try the next one

    const [userAId, userBId] = [userId, friendId].sort();
    try {
      await prisma.sparkChain.create({ data: { userAId, userBId, roundDate: questionActiveDate } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002") continue; // race: this pair already sparked for this round, try the next candidate
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

// One-time (but safe to re-run) reconciliation for the switch to
// round-based spark matching. Replays every correct answer ever submitted,
// in the order it originally happened, through the same
// tryTriggerSparkChain logic above — so any pair who would have sparked
// under the current round-based rule, but didn't (different answer days,
// or an earlier version of this logic's cap got in the way), gets their
// spark retroactively. Already-sparked pairs/rounds are skipped via the
// same uniqueness checks used for live sparks, so running this more than
// once won't double-award anything, and it won't touch rounds that already
// correctly sparked once.
export async function backfillSparkChains(): Promise<{ checked: number; created: number }> {
  const answers = await prisma.answer.findMany({
    where: { isCorrect: true },
    orderBy: { answeredAt: "asc" },
    select: { userId: true, question: { select: { activeDate: true } } },
  });

  let created = 0;
  for (const a of answers) {
    const result = await tryTriggerSparkChain(a.userId, a.question.activeDate);
    if (result) created++;
  }

  return { checked: answers.length, created };
}

// A short-lived earlier version of this feature matched sparks on the
// exact question rather than the round, which let one round with several
// questions (e.g. two dailies plus a bonus) spark repeatedly with the same
// friend instead of just once. This clears that out and rebuilds spark
// chain history from scratch under the current round-based rule, so
// anyone who was over-awarded during that window gets corrected.
//
// Deliberately only touches SparkChain rows and SPARK_CHAIN-type
// LogTransaction rows — logs from questions, streak bonuses, and admin
// grants all use their own distinct transaction types and are never
// touched here. Safe to run more than once: it always ends at the exact
// same, correct state (one spark per pair per round), since it's a full
// wipe-and-recompute rather than an incremental patch.
export async function resetAndRebuildSparkChains(): Promise<{
  removedSparkChains: number;
  removedLogTransactions: number;
  checked: number;
  created: number;
}> {
  const [removedLogTransactions, removedSparkChains] = await prisma.$transaction([
    prisma.logTransaction.deleteMany({ where: { type: "SPARK_CHAIN" } }),
    prisma.sparkChain.deleteMany({}),
  ]);

  const { checked, created } = await backfillSparkChains();

  return {
    removedSparkChains: removedSparkChains.count,
    removedLogTransactions: removedLogTransactions.count,
    checked,
    created,
  };
}
