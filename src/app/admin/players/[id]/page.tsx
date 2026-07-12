import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTierForLogs } from "@/lib/bonfire";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import StatCard from "@/components/StatCard";
import IssueLogsForm from "@/components/admin/IssueLogsForm";
import PlayerManageForm from "@/components/admin/PlayerManageForm";
import SectionHeader from "@/components/SectionHeader";
import { ArrowLeft, CheckCircle2, Flame, ListChecks, Receipt, XCircle } from "lucide-react";

export default async function AdminPlayerDetailPage({ params }: { params: { id: string } }) {
  const player = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, createdAt: true, role: true, avatarColor: true, avatarIcon: true },
  });
  if (!player) notFound();

  const [answers, transactions, logSum] = await Promise.all([
    prisma.answer.findMany({ where: { userId: params.id }, include: { question: true }, orderBy: { answeredAt: "desc" } }),
    prisma.logTransaction.findMany({
      where: { userId: params.id },
      include: { issuedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.logTransaction.aggregate({ where: { userId: params.id }, _sum: { amount: true } }),
  ]);

  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.length - correct;
  const logs = logSum._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <Link href="/admin/players" className="inline-flex items-center gap-1 text-sm text-ash-500 hover:text-ember-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Players
      </Link>
      <div className="flex items-center gap-3">
        <Avatar id={player.id} name={player.name} size="md" avatarColor={player.avatarColor} avatarIcon={player.avatarIcon} />
        <div>
          <h1 className="font-display text-2xl font-bold text-ash-100">{player.name}</h1>
          <p className="text-ash-500">
            {player.email} &middot; joined {new Date(player.createdAt).toLocaleDateString()} &middot; {getTierForLogs(logs).label} tier
          </p>
        </div>
        <Badge tone={player.role === "ADMIN" ? "ember" : "neutral"}>{player.role}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ListChecks} label="Answered" tone="navy" value={answers.length} />
        <StatCard icon={CheckCircle2} label="Correct" tone="success" value={correct} />
        <StatCard icon={XCircle} label="Wrong" tone="danger" value={wrong} />
        <StatCard icon={Flame} label="Total logs" tone="ember" value={logs} />
      </div>

      <PlayerManageForm playerId={player.id} initialName={player.name} role={player.role} />

      <IssueLogsForm playerId={player.id} />

      <div>
        <SectionHeader icon={ListChecks} tone="navy" title="Answer History" className="mb-4" />
        {answers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-6 text-center text-ash-500">
            <ListChecks className="h-6 w-6 text-ash-600" />
            <p>No answers yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card shadow-card">
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
        <SectionHeader icon={Receipt} tone="ember" title="Log Transaction History" className="mb-4" />
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-6 text-center text-ash-500">
            <Receipt className="h-6 w-6 text-ash-600" />
            <p>No log transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card shadow-card">
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
