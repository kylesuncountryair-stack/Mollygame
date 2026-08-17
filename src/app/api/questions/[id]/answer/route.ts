import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getTierForLogs, startOfTodayCT, endOfTodayCT } from "@/lib/bonfire";
import { tryTriggerSparkChain } from "@/lib/sparkChain";
import { tryTriggerStreakBonus } from "@/lib/answerStreakBonus";
import { BONUS_LOGS_REWARD, isEligibleForBonusQuestion, getTodaysUnlockedBonusQuestion } from "@/lib/bonusQuestion";
import { getCurrentDailyRoundDate } from "@/lib/dailyQuestions";
import { isRandomQuestionWinner, getTodaysRandomQuestionIfWon } from "@/lib/randomQuestion";

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

  // Random questions only ever go to the handful of players randomly
  // picked for them (see src/lib/randomQuestion.ts) — re-checked here so
  // it can't be bypassed by POSTing directly to a known random question
  // id. By the time someone can even see this question to answer it, the
  // dashboard has already confirmed they won a slot, so this is just
  // closing the same loophole BONUS closes above.
  if (question.type === "RANDOM") {
    const isToday = question.activeDate >= startOfTodayCT() && question.activeDate < endOfTodayCT();
    if (!isToday || !(await isRandomQuestionWinner(session.sub, question.id))) {
      return NextResponse.json({ error: "This question isn't available to you." }, { status: 403 });
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

  // Spark chains are meant to reward playing along DURING the week, not
  // catching up on a past round after the fact (see the "catch up" prompt
  // offered on the dashboard Sun/Mon for DAILY questions missed last
  // week). A DAILY answer only counts as "live" if its question belongs to
  // the CURRENT round — anything older is being answered late, whether via
  // the catch-up flow or just an old link, so it's skipped either way.
  // WEEKLY and BONUS answers are always live (there's no catch-up path for
  // them), so they're unaffected.
  const isLiveRound =
    question.type !== "DAILY" ||
    (await getCurrentDailyRoundDate().then((d) => !!d && d.getTime() === question.activeDate.getTime()));

  // Best-effort: a spark chain is a small bonus, not core game logic, so a
  // failure here shouldn't fail the answer submission itself.
  const sparkChain =
    isCorrect && isLiveRound ? await tryTriggerSparkChain(session.sub, question.activeDate).catch(() => null) : null;
  const streakBonus = isCorrect ? await tryTriggerStreakBonus(session.sub).catch(() => null) : null;

  // Whoever is first (today) to answer any of today's DAILY questions —
  // correct or not — unlocks that day's bonus question, if one is
  // scheduled. The bonus question itself only appears once the dashboard
  // re-fetches; this just lets the daily card show an immediate "you
  // unlocked it" note.
  const bonusUnlocked =
    question.type === "DAILY" ? await getTodaysUnlockedBonusQuestion(session.sub).catch(() => null) : null;

  // Answering a DAILY question correctly is what makes someone eligible
  // for today's RANDOM question (if there is one, and they're not
  // excluded for being a top-ranked player) — this both ticks the random
  // draw forward immediately and lets the client show a "you were picked!"
  // popup right away instead of waiting for the next dashboard load.
  const randomUnlocked =
    isCorrect && question.type === "DAILY" ? await getTodaysRandomQuestionIfWon(session.sub).catch(() => null) : null;

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
    randomUnlocked: randomUnlocked
      ? { id: randomUnlocked.id, prompt: randomUnlocked.prompt, logsReward: randomUnlocked.logsReward }
      : null,
  });
}
