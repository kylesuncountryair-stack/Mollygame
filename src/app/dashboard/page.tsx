import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC, monthLabel } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import { computeStreak } from "@/lib/streak";
import BonfireVisual from "@/components/BonfireVisual";
import QuestionCard from "@/components/QuestionCard";
import StatCard from "@/components/StatCard";
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

      <div className="grid gap-6 md:grid-cols-[auto,1fr]">
        <div className="flex items-center justify-center rounded-2xl border border-ash-900 bg-bg-card p-8">
          <BonfireVisual logs={monthlyLogs} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Flame} label="Current streak" value={streak} hint={streak === 1 ? "day" : "days"} />
          <StatCard
            icon={Award}
            label="Your rank"
            value={selfRow ? `#${selfRow.rank}` : "—"}
            hint={selfRow ? `of ${leaderboardRows.length} this month` : undefined}
          />
          <StatCard icon={Trophy} label="All-time logs" value={allTimeLogs} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuestionCard question={attach(dailyQ)} />
        <QuestionCard question={attach(weeklyQ)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {selfRow && <NearbyRank rows={leaderboardRows} selfId={userId} />}
        {selfRow && (
          <FriendsWidget
            me={{ id: userId, name: session!.name, monthlyLogs: selfRow.monthlyLogs, allTimeLogs: selfRow.allTimeLogs, tier: selfRow.tier }}
          />
        )}
      </div>
    </div>
  );
}
