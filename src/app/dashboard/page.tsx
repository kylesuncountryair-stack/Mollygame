import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC, monthLabel } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import { computeStreak } from "@/lib/streak";
import BonfireVisual from "@/components/BonfireVisual";
import QuestionCard from "@/components/QuestionCard";
import NearbyRank from "@/components/NearbyRank";
import FriendsWidget from "@/components/FriendsWidget";
import { Award, Flame, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const userId = session!.sub;

  const [dailyQ, weeklyQ, monthlySum, allTimeSum, correctDailyAnswers, leaderboardRows] = await Promise.all([
    prisma.question.findFirst({
      where: { type: "DAILY", activeDate: { gte: startOfTodayUTC(), lt: endOfTodayUTC() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.question.findFirst({
      where: { type: "WEEKLY", activeDate: { gte: startOfWeekUTC(), lt: endOfWeekUTC() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.logTransaction.aggregate({ where: { userId, createdAt: { gte: startOfMonthUTC() } }, _sum: { amount: true } }),
    prisma.logTransaction.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.answer.findMany({
      where: { userId, isCorrect: true, question: { type: "DAILY" } },
      select: { question: { select: { activeDate: true } } },
    }),
    getLeaderboardRows(),
  ]);

  const ids = [dailyQ?.id, weeklyQ?.id].filter(Boolean) as string[];
  const answers = ids.length ? await prisma.answer.findMany({ where: { userId, questionId: { in: ids } } }) : [];

  const attach = (q: typeof dailyQ) =>
    q
      ? {
          id: q.id,
          type: q.type,
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

  const monthlyLogs = monthlySum._sum.amount ?? 0;
  const allTimeLogs = allTimeSum._sum.amount ?? 0;
  const streak = computeStreak(correctDailyAnswers.map((a) => a.question.activeDate));
  const selfRow = leaderboardRows.find((r) => r.id === userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Welcome back, {session!.name.split(" ")[0]}</h1>
        <p className="text-ash-500">{monthLabel()} bonfire</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px,1fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-2xl border border-ash-900 bg-bg-card p-8">
            <BonfireVisual logs={monthlyLogs} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-ash-700 border-l-[3px] border-l-ember-500 bg-bg-card px-2 py-3 text-center">
              <Flame className="mx-auto h-4 w-4 text-ember-400" />
              <div className="font-display text-lg font-semibold text-white">{streak}</div>
              <div className="text-xs text-ash-500">day streak</div>
            </div>
            <div className="rounded-lg border border-ash-700 border-l-[3px] border-l-gold-400 bg-bg-card px-2 py-3 text-center">
              <Award className="mx-auto h-4 w-4 text-gold-400" />
              <div className="font-display text-lg font-semibold text-white">{selfRow ? `#${selfRow.rank}` : "—"}</div>
              <div className="text-xs text-ash-500">rank</div>
            </div>
            <div className="rounded-lg border border-ash-700 border-l-[3px] border-l-navy-300 bg-bg-card px-2 py-3 text-center">
              <Trophy className="mx-auto h-4 w-4 text-navy-300" />
              <div className="font-display text-lg font-semibold text-white">{allTimeLogs}</div>
              <div className="text-xs text-ash-500">all-time logs</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selfRow && <NearbyRank rows={leaderboardRows} selfId={userId} />}
          {selfRow && (
            <FriendsWidget
              me={{ id: userId, name: session!.name, monthlyLogs: selfRow.monthlyLogs, allTimeLogs: selfRow.allTimeLogs, tier: selfRow.tier }}
            />
          )}
        </div>

        <div className="space-y-6">
          <QuestionCard question={attach(dailyQ)} />
          <QuestionCard question={attach(weeklyQ)} />
        </div>
      </div>
    </div>
  );
}
