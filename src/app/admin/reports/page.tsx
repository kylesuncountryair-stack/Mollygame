import { prisma } from "@/lib/prisma";
import { daysAgoCT } from "@/lib/bonfire";
import { getMonthlyHistory } from "@/lib/history";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import Badge from "@/components/Badge";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Flame,
  HelpCircle,
  History,
  ListChecks,
  Users,
} from "lucide-react";

function correctRateTone(rate: number | null): "success" | "gold" | "danger" | "neutral" {
  if (rate === null) return "neutral";
  if (rate >= 0.8) return "success";
  if (rate >= 0.5) return "gold";
  return "danger";
}

export default async function AdminReportsPage() {
  const [playerCount, questionCount, answers, logSum, monthlyHistory, questions] = await Promise.all([
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.question.count(),
    prisma.answer.findMany({ select: { userId: true, questionId: true, answeredAt: true, isCorrect: true } }),
    prisma.logTransaction.aggregate({ _sum: { amount: true } }),
    getMonthlyHistory(),
    prisma.question.findMany({ orderBy: { activeDate: "desc" }, select: { id: true, prompt: true, type: true, activeDate: true } }),
  ]);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const overallRate = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;

  // Daily participation: unique players who answered anything, per Central
  // day, over the last 14 days — a rolling window rather than a full
  // history so the chart stays readable and cheap to compute.
  const rangeStart = daysAgoCT(13);
  const recentAnswers = answers.filter((a) => a.answeredAt >= rangeStart);
  const dayMap = new Map<string, Set<string>>();
  for (const a of recentAnswers) {
    const key = a.answeredAt.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    if (!dayMap.has(key)) dayMap.set(key, new Set());
    dayMap.get(key)!.add(a.userId);
  }
  const days = Array.from({ length: 14 }, (_, idx) => {
    const i = 13 - idx;
    const d = daysAgoCT(i);
    const key = d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    const label = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "America/Chicago" });
    return { key, label, count: dayMap.get(key)?.size ?? 0 };
  });
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  const perQuestion = questions.map((q) => {
    const qAnswers = answers.filter((a) => a.questionId === q.id);
    const correct = qAnswers.filter((a) => a.isCorrect).length;
    return {
      ...q,
      answered: qAnswers.length,
      correct,
      rate: qAnswers.length ? correct / qAnswers.length : null,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ash-100">Reports</h1>
          <p className="text-ash-500">Participation, question performance, and past Bonfires.</p>
        </div>
        <a
          href="/api/admin/players/export"
          download
          className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-3 py-1.5 text-xs font-medium text-ash-200 hover:border-ember-500 hover:text-ember-200"
        >
          <Download className="h-3.5 w-3.5" /> Download CSV
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Players" tone="navy" value={playerCount} />
        <StatCard icon={HelpCircle} label="Questions" tone="gold" value={questionCount} />
        <StatCard icon={ListChecks} label="Answers submitted" tone="navy" value={answers.length} />
        <StatCard icon={CheckCircle2} label="Overall correct rate" tone="success" value={`${overallRate}%`} />
      </div>

      <div>
        <SectionHeader
          icon={BarChart3}
          tone="navy"
          title="Daily Participation"
          subtitle="Unique players who answered anything, last 14 days"
          className="mb-4"
        />
        <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
          <div className="flex items-end gap-2" style={{ height: 140 }}>
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${d.count} players`}>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-ember-600 to-ember-400 transition-all"
                    style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-ash-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionHeader
          icon={HelpCircle}
          tone="gold"
          title="Question Performance"
          subtitle="Correct rate per question, most recent first"
          className="mb-4"
        />
        {perQuestion.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
            <HelpCircle className="h-6 w-6 text-ash-600" />
            <p>No questions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ash-900 bg-bg-card shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-ash-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Question</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Answered</th>
                  <th className="px-5 py-3 font-medium text-right">Correct</th>
                  <th className="px-5 py-3 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {perQuestion.map((q) => (
                  <tr key={q.id} className="border-t border-ash-900 hover:bg-ash-900/40">
                    <td className="max-w-xs truncate px-5 py-3 text-ash-100">{q.prompt}</td>
                    <td className="px-5 py-3">
                      <Badge tone={q.type === "WEEKLY" ? "ember" : "neutral"}>{q.type}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ash-500">
                      {new Date(q.activeDate).toLocaleDateString(undefined, { timeZone: "America/Chicago" })}
                    </td>
                    <td className="px-5 py-3 text-right text-ash-100">{q.answered}</td>
                    <td className="px-5 py-3 text-right text-emerald-400">{q.correct}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={correctRateTone(q.rate)}>{q.rate === null ? "—" : `${Math.round(q.rate * 100)}%`}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          icon={History}
          tone="ember"
          title="Past Bonfires"
          subtitle="Final standings from completed months"
          className="mb-4"
        />
        {monthlyHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
            <History className="h-6 w-6 text-ash-600" />
            <p>No completed months yet — check back after this month ends.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthlyHistory.map((m) => (
              <div key={m.label} className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-white">{m.label}</h3>
                  <span className="flex items-center gap-3 text-xs text-ash-500">
                    <span>{m.participantCount} players</span>
                    <span className="flex items-center gap-1 text-ember-300">
                      <Flame className="h-3 w-3" /> {m.totalLogsIssued} logs
                    </span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  {m.standings.slice(0, 3).map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-bg-panel px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-4 text-xs font-semibold text-gold-300">#{i + 1}</span>
                        <span className="text-ash-100">{s.name}</span>
                        <span className="text-xs text-ash-500">{s.tier}</span>
                      </span>
                      <span className="font-semibold text-ember-400">{s.logs} logs</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
