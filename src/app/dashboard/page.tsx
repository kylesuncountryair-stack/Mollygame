import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfWeekCT, endOfWeekCT, monthLabel, isCatchUpWindowCT, lastWeekBoundsCT } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import { getActiveDailyQuestions } from "@/lib/dailyQuestions";
import { computeStreak } from "@/lib/streak";
import BonfireVisual from "@/components/BonfireVisual";
import QuestionCard from "@/components/QuestionCard";
import NearbyRank from "@/components/NearbyRank";
import FriendsWidget from "@/components/FriendsWidget";
import OnboardingTour from "@/components/OnboardingTour";
import CatchUpBanner from "@/components/CatchUpBanner";
import { getTodaysUnlockedBonusQuestion } from "@/lib/bonusQuestion";
import { getTodaysRandomQuestionIfWon } from "@/lib/randomQuestion";
import { Award, Flame, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const userId = session!.sub;

  const [dailyQuestions, weeklyQ, logSum, correctDailyAnswers, scheduledDailyDates, leaderboardRows, me] = await Promise.all([
    // All DAILY questions sharing the most recent scheduled date that isn't
    // in the future — stays active (as a set) until the next scheduled
    // date's questions arrive. E.g. if the last DAILY questions are dated
    // Aug 3 and the next ones are dated Aug 5, Aug 3's questions keep
    // showing through Aug 4.
    getActiveDailyQuestions(),
    prisma.question.findFirst({
      where: { type: "WEEKLY", activeDate: { gte: startOfWeekCT(), lt: endOfWeekCT() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.logTransaction.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.answer.findMany({
      where: { userId, isCorrect: true, question: { type: "DAILY" } },
      select: { question: { select: { activeDate: true } } },
    }),
    // Every distinct calendar day that has ever had a DAILY question — the
    // day streak below walks through these (not raw calendar days), since
    // daily questions only run a few days a week rather than every day.
    prisma.question.findMany({
      where: { type: "DAILY" },
      select: { activeDate: true },
      distinct: ["activeDate"],
    }),
    getLeaderboardRows(),
    prisma.user.findUnique({ where: { id: userId }, select: { hasSeenOnboarding: true } }),
  ]);

  // Only set when this user was first (today) to answer any of today's
  // active DAILY questions, and a BONUS question is scheduled for today.
  const bonusQ = await getTodaysUnlockedBonusQuestion(userId);

  // Only set when a RANDOM question is scheduled for today AND this user is
  // one of the (at most two) players randomly picked for it — everyone else
  // simply never sees it, so no "you weren't picked" messaging is needed.
  const randomQ = await getTodaysRandomQuestionIfWon(userId);

  // Sunday and Monday only: DAILY questions from last week (see
  // lastWeekBoundsCT) this player never got to. Offered as an optional
  // "catch up" prompt rather than shown automatically — answering them
  // still counts toward logs/tier/streak, just without spark chains (see
  // the isLiveRound check in the answer API route).
  let missedCatchUpQuestions: typeof dailyQuestions = [];
  if (isCatchUpWindowCT()) {
    const { start, end } = lastWeekBoundsCT();
    missedCatchUpQuestions = await prisma.question.findMany({
      where: { type: "DAILY", activeDate: { gte: start, lt: end }, answers: { none: { userId } } },
      orderBy: { activeDate: "asc" },
    });
  }

  const ids = [
    ...dailyQuestions.map((q) => q.id),
    weeklyQ?.id,
    bonusQ?.id,
    randomQ?.id,
    ...missedCatchUpQuestions.map((q) => q.id),
  ].filter(Boolean) as string[];
  const answers = ids.length ? await prisma.answer.findMany({ where: { userId, questionId: { in: ids } } }) : [];

  const attach = (q: typeof weeklyQ) =>
    q
      ? {
          id: q.id,
          type: q.type,
          format: q.format,
          prompt: q.prompt,
          options: q.options as string[],
          logsReward: q.logsReward,
          answered: answers.find((a) => a.questionId === q.id)
            ? {
                selectedIndex: answers.find((a) => a.questionId === q.id)!.selectedIndex,
                isCorrect: answers.find((a) => a.questionId === q.id)!.isCorrect,
                logsAwarded: answers.find((a) => a.questionId === q.id)!.logsAwarded,
              }
            : null,
        }
      : null;

  const logs = logSum._sum.amount ?? 0;
  const streak = computeStreak(
    scheduledDailyDates.map((q) => q.activeDate),
    correctDailyAnswers.map((a) => a.question.activeDate)
  );
  const selfRow = leaderboardRows.find((r) => r.id === userId);

  return (
    <div className="space-y-8">
      <OnboardingTour initialSeen={me?.hasSeenOnboarding ?? true} />
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Welcome back, {session!.name.split(" ")[0]}</h1>
        <p className="text-ash-500">{monthLabel()} bonfire</p>
      </div>

      <CatchUpBanner questions={missedCatchUpQuestions.map(attach)} />

      <div className="grid gap-6 xl:grid-cols-[320px,1fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-2xl border border-ash-900 bg-bg-card shadow-card p-8">
            <BonfireVisual logs={logs} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-ash-700 bg-bg-card px-2 py-3 text-center shadow-card">
              <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-ember-500/15">
                <Flame className="h-3.5 w-3.5 text-ember-400" />
              </span>
              <div className="mt-1.5 font-display text-lg font-semibold text-white">{streak}</div>
              <div className="text-xs text-ash-500">day streak</div>
            </div>
            <div className="rounded-lg border border-ash-700 bg-bg-card px-2 py-3 text-center shadow-card">
              <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/15">
                <Award className="h-3.5 w-3.5 text-gold-400" />
              </span>
              <div className="mt-1.5 font-display text-lg font-semibold text-white">{selfRow ? `#${selfRow.rank}` : "—"}</div>
              <div className="text-xs text-ash-500">rank</div>
            </div>
            <div className="rounded-lg border border-ash-700 bg-bg-card px-2 py-3 text-center shadow-card">
              <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-navy-300/15">
                <Trophy className="h-3.5 w-3.5 text-navy-300" />
              </span>
              <div className="mt-1.5 font-display text-lg font-semibold text-white">{logs}</div>
              <div className="text-xs text-ash-500">total logs</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selfRow && <NearbyRank rows={leaderboardRows} selfId={userId} />}
          {selfRow && (
            <FriendsWidget
              me={{
                id: userId,
                name: session!.name,
                logs: selfRow.logs,
                tier: selfRow.tier,
                avatarColor: selfRow.avatarColor,
                avatarIcon: selfRow.avatarIcon,
              }}
            />
          )}
        </div>

        <div className="space-y-6">
          {bonusQ && <QuestionCard question={attach(bonusQ)} />}
          {randomQ && <QuestionCard question={attach(randomQ)} />}
          {dailyQuestions.length > 0 ? (
            dailyQuestions.map((q) => <QuestionCard key={q.id} question={attach(q)} />)
          ) : (
            <QuestionCard question={null} />
          )}
          <QuestionCard question={attach(weeklyQ)} />
        </div>
      </div>
    </div>
  );
}
