import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";
import BonfireVisual from "@/components/BonfireVisual";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import StatCard from "@/components/StatCard";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import EditNameForm from "@/components/EditNameForm";
import AvatarPicker from "@/components/AvatarPicker";
import SectionHeader from "@/components/SectionHeader";
import { CheckCircle2, ListChecks, XCircle } from "lucide-react";

export default async function ProfilePage() {
  const session = await getCurrentSession();
  const userId = session!.sub;

  const [answers, monthlySum, allTimeSum, me] = await Promise.all([
    prisma.answer.findMany({ where: { userId }, include: { question: true }, orderBy: { answeredAt: "desc" } }),
    prisma.logTransaction.aggregate({ where: { userId, createdAt: { gte: startOfMonthCT() } }, _sum: { amount: true } }),
    prisma.logTransaction.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { avatarColor: true, avatarIcon: true } }),
  ]);

  const correct = answers.filter((a) => a.isCorrect).length;
  const wrong = answers.length - correct;
  const monthlyLogs = monthlySum._sum.amount ?? 0;
  const allTimeLogs = allTimeSum._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Avatar id={session!.sub} name={session!.name} size="md" avatarColor={me?.avatarColor} avatarIcon={me?.avatarIcon} />
        <div>
          <h1 className="font-display text-2xl font-bold text-ash-100">{session!.name}</h1>
          <p className="text-ash-500">{session!.email}</p>
          <div className="mt-1 flex items-center gap-3">
            <EditNameForm initialName={session!.name} />
          </div>
          <div className="mt-1">
            <AvatarPicker userId={session!.sub} name={session!.name} initialColor={me?.avatarColor} initialIcon={me?.avatarIcon} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto,1fr]">
        <div className="flex items-center justify-center rounded-2xl border border-ash-900 bg-bg-card shadow-card p-8">
          <BonfireVisual logs={monthlyLogs} size="sm" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={ListChecks} label="Answered" tone="navy" value={answers.length} />
          <StatCard icon={CheckCircle2} label="Correct" tone="success" value={correct} />
          <StatCard icon={XCircle} label="Wrong" tone="danger" value={wrong} />
        </div>
      </div>

      <div>
        <SectionHeader icon={ListChecks} tone="navy" title="Answer History" className="mb-4" />
        {answers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
            <ListChecks className="h-6 w-6 text-ash-600" />
            <p>You haven&apos;t answered any questions yet.</p>
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
                    <td className="px-5 py-3 text-right text-ash-500">
                      {new Date(a.answeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ChangePasswordForm />
    </div>
  );
}
