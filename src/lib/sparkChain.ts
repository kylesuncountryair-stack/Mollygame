import { prisma } from "@/lib/prisma";
import { startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";

export const SPARK_CHAIN_BONUS = 1;

export type SparkChainResult = { friendName: string; bonus: number } | null;

// Call this right after recording a correct answer. If any of the player's
// circle (people they follow) also answered something correctly somewhere
// today (Central time), and this exact pair hasn't already sparked today,
// both players get a small bonus log — a lightweight nudge to remind
// coworkers to play together rather than solo.
//
// Capped at one spark per player per day (checked for BOTH sides of the
// pair) so it can't be farmed by following a lot of people, and isn't a
// bigger reward than the questions themselves.
export async function tryTriggerSparkChain(userId: string): Promise<SparkChainResult> {
  const dateKey = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const todayStart = startOfTodayCT();
  const todayEnd = endOfTodayCT();

  const alreadySparked = await prisma.sparkChain.findFirst({
    where: { dateKey, OR: [{ userAId: userId }, { userBId: userId }] },
  });
  if (alreadySparked) return null;

  const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  if (following.length === 0) return null;
  const friendIds = following.map((f) => f.followingId);

  // Ordered by answeredAt ascending (combined with `distinct`, Prisma keeps
  // each user's EARLIEST qualifying row) so that when more than one circle
  // member already answered today, the spark deterministically goes to
  // whoever played first — not an arbitrary database order.
  const friendCorrectAnswers = await prisma.answer.findMany({
    where: { userId: { in: friendIds }, isCorrect: true, answeredAt: { gte: todayStart, lt: todayEnd } },
    select: { userId: true },
    distinct: ["userId"],
    orderBy: { answeredAt: "asc" },
  });
  if (friendCorrectAnswers.length === 0) return null;

  for (const { userId: friendId } of friendCorrectAnswers) {
    const friendAlreadySparked = await prisma.sparkChain.findFirst({
      where: { dateKey, OR: [{ userAId: friendId }, { userBId: friendId }] },
    });
    if (friendAlreadySparked) continue; // this friend already used their spark today — try the next one

    const [userAId, userBId] = [userId, friendId].sort();
    try {
      await prisma.sparkChain.create({ data: { userAId, userBId, dateKey } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002") continue; // race: this pair already sparked today, try the next candidate
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
