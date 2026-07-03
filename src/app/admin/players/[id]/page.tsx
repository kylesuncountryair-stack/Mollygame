import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import StatCard from "@/components/StatCard";
import IssueLogsForm from "@/components/admin/IssueLogsForm";
import PlayerManageForm from "@/components/admin/PlayerManageForm";
import { CheckCircle2, Flame, ListChecks, XCircle } from "lucide-react";

export default async function AdminPlayerDetailPage({ params }: { params: { id: string } }) {
  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, createdAt: true, role: true },
  });
  if (!player) notFound();

  const [answers, transactions, allTimeSum, monthlySum] = await Promise.all([
    prisma.answer.findMany({ where: { userId: params.id }, include: { question: true }, orderBy: { answeredAt: "desc" } }),
    prisma.logTransaction.findMany({
      where: { userId: params.id },
      include: { issuedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.logTransaction.aggregate({ where: { userId: params.id }, _sum: { amount: true } }),
    prisma.logTransaction.aggregate({ where: { userId: params.id, createdAt: { gte: startOfMonthCT() } }, _sum: { amount: true } }),
  ]);

  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.length - correct;
  const allTimeLogs = allTimeSum._sum.amount ?? 0;
  const monthlyLogs = monthlySum._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Avatar id={player.id} name={player.name} size="md" />
        <div>
          <h1 className="font-display text-2xl font-bold text-ash-100">{player.name}</h1>
          <p className="text-ash-500">
            {player.email} &middot; joined {new Date(player.createdAt).toLocaleDateString()} &middot; {getTierForLogs(monthlyLogs).label} tier
          </p>
        </div>
        <Badge tone={player.role === "ADMIN" ? "ember" : "neutral"}>{player.role}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Answered" value={answers.length} />
        <StatCard icon={CheckCircle2} label="Correct" value={correct} />
        <StatCard icon={XCircle} label="Wrong" value={wrong} />
        <StatCard icon={Flame} label="Total logs" value={allTimeLogs} hint={`${monthlyLogs} this month`} />
      </div>

      <PlayerManageForm playerId={player.id} initialName={player.name} role={player.role} />

      <IssueLogsForm playerId={player.id} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ash-100">Answer History</h2>
        {answers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ash-700 p-6 text-center text-ash-500">No answers yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-ash-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Question</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 font-medium text-right">Logs</th>
                  <th className="px-5 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((a) => (
                  <tr key={a.id} className="border-t border-ash-900">
                    <td className="max-w-md px-5 py-3 text-ash-100">{a.question.prompt}</td>
                    <td className="px-5 py-3 text-ash-500">{a.question.type}</td>
                    <td className="px-5 py-3">
                      <Badge tone={a.isCorrect ? "success" : "danger"}>{a.isCorrect ? "Correct" : "Wrong"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-ash-100">{a.logsAwarded}</td>
                    <td className="px-5 py-3 text-right text-ash-500">{new Date(a.answeredAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ash-100">Log Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ash-700 p-6 text-center text-ash-500">No log transactions yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-ash-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Issued By</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-ash-900">
                    <td className="max-w-md px-5 py-3 text-ash-100">{t.reason}</td>
                    <td className="px-5 py-3 text-ash-500">{t.type.replace("_", " ")}</td>
                    <td className="px-5 py-3 text-ash-500">{t.issuedBy?.name ?? "—"}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${t.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td className="px-5 py-3 text-right text-ash-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
