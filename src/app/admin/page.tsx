import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import { HelpCircle, ListChecks, Users, Flame } from "lucide-react";

export default async function AdminOverviewPage() {
  const [playerCount, questionCount, answerCount, logSum] = await Promise.all([
    prisma.user.count({ where: { role: "PLAYER" } }),
    prisma.question.count(),
    prisma.answer.count(),
    prisma.logTransaction.aggregate({ _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Admin Overview</h1>
        <p className="text-ash-500">A snapshot of your Bonfire game.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Players" value={playerCount} />
        <StatCard icon={HelpCircle} label="Questions" value={questionCount} />
        <StatCard icon={ListChecks} label="Answers submitted" value={answerCount} />
        <StatCard icon={Flame} label="Total logs issued" value={logSum._sum.amount ?? 0} />
      </div>
    </div>
  );
}
