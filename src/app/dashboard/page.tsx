import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonthUTC, startOfTodayUTC, endOfTodayUTC, startOfWeekUTC, endOfWeekUTC, monthLabel } from "@/lib/bonfire";
import BonfireVisual from "@/components/BonfireVisual";
import BonfireTierGuide from "@/components/BonfireTierGuide";
import QuestionCard from "@/components/QuestionCard";
import StatCard from "@/components/StatCard";
import { CheckCircle2, ListChecks, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const userId = session!.sub;

  const [dailyQ, weeklyQ, monthlySum, allTimeSum, answeredCount, correctCount] = await Promise.all([
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
    prisma.answer.count({ where: { userId } }),
    prisma.answer.count({ where: { userId, isCorrect: true } }),
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
          <StatCard icon={Trophy} label="All-time logs" value={allTimeLogs} />
          <StatCard icon={ListChecks} label="Questions answered" value={answeredCount} />
          <StatCard icon={CheckCircle2} label="Correct answers" value={correctCount} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuestionCard question={attach(dailyQ)} />
        <QuestionCard question={attach(weeklyQ)} />
      </div>

      <BonfireTierGuide />
    </div>
  );
}
