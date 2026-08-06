import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getTierForLogs, startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";
import { tryTriggerSparkChain } from "@/lib/sparkChain";
import { tryTriggerStreakBonus } from "@/lib/answerStreakBonus";
import { BONUS_LOGS_REWARD, isEligibleForBonusQuestion, getTodaysUnlockedBonusQuestion } from "@/lib/bonusQuestion";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const selectedIndex = body?.selectedIndex;
  if (typeof selectedIndex !== "number") {
    return NextResponse.json({ error: "selectedIndex is required." }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  const existing = await prisma.answer.findUnique({
    where: { userId_questionId: { userId: session.sub, questionId: question.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already answered this question." }, { status: 409 });
  }

  // Bonus questions are only open to whoever was first (today) to answer the
  // currently-active DAILY question — re-checked here server-side so it
  // can't be bypassed by POSTing directly to a known bonus question id. Also
  // confirms the bonus question itself is dated today, so a stale/known id
  // from a past day can't be replayed.
  if (question.type === "BONUS") {
    const isToday = question.activeDate >= startOfTodayCT() && question.activeDate < endOfTodayCT();
    if (!isToday || !(await isEligibleForBonusQuestion(session.sub))) {
      return NextResponse.json({ error: "This bonus question isn't available to you." }, { status: 403 });
    }
  }

  const isCorrect = selectedIndex === question.correctIndex;
  const logsAwarded = isCorrect ? (question.type === "BONUS" ? BONUS_LOGS_REWARD : question.logsReward) : 0;

  // Snapshot the tier before this answer lands, so we can tell the client
  // whether this specific answer pushed the player into a new tier (for the
  // tier-up celebration banner).
  const logSumBefore = await prisma.logTransaction.aggregate({
    where: { userId: session.sub },
    _sum: { amount: true },
  });
  const logsBefore = logSumBefore._sum.amount ?? 0;
  const logsAfter = logsBefore + logsAwarded;
  const tierBefore = getTierForLogs(logsBefore);
  const tierAfter = getTierForLogs(logsAfter);
  const tierUp = isCorrect && tierAfter.key !== tierBefore.key ? { key: tierAfter.key, label: tierAfter.label } : null;

  const answer = await prisma.$transaction(async (tx) => {
    const created = await tx.answer.create({
      data: {
        userId: session.sub,
        questionId: question.id,
        selectedIndex,
        isCorrect,
        logsAwarded,
      },
    });
    if (isCorrect) {
      await tx.logTransaction.create({
        data: {
          userId: session.sub,
          amount: logsAwarded,
          reason: `Correct answer: "${question.prompt}"`,
          type: "QUESTION_CORRECT",
        },
      });
    }
    return created;
  });

  // Best-effort: a spark chain is a small bonus, not core game logic, so a
  // failure here shouldn't fail the answer submission itself.
  const sparkChain = isCorrect ? await tryTriggerSparkChain(session.sub, question.activeDate).catch(() => null) : null;
  const streakBonus = isCorrect ? await tryTriggerStreakBonus(session.sub).catch(() => null) : null;

  // Whoever is first (today) to answer any of today's DAILY questions —
  // correct or not — unlocks that day's bonus question, if one is
  // scheduled. The bonus question itself only appears once the dashboard
  // re-fetches; this just lets the daily card show an immediate "you
  // unlocked it" note.
  const bonusUnlocked =
    question.type === "DAILY" ? await getTodaysUnlockedBonusQuestion(session.sub).catch(() => null) : null;

  return NextResponse.json({
    isCorrect,
    logsAwarded,
    correctIndex: question.correctIndex,
    // Only meaningful (and only ever sent) after the player has submitted —
    // withheld from the pre-answer question fetch so it can't be peeked at.
    explanation: !isCorrect ? question.explanation : null,
    answerId: answer.id,
    tierUp,
    sparkChain,
    streakBonus,
    bonusUnlocked: bonusUnlocked ? { id: bonusUnlocked.id, prompt: bonusUnlocked.prompt } : null,
  });
}
