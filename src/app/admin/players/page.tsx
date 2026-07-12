import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTierForLogs } from "@/lib/bonfire";
import Avatar from "@/components/Avatar";
import SectionHeader from "@/components/SectionHeader";
import AdminPlayersTable from "@/components/admin/AdminPlayersTable";
import { Download, ShieldCheck } from "lucide-react";

export default async function AdminPlayersPage() {
  const [players, admins] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PLAYER" },
      select: { id: true, name: true, email: true, createdAt: true, avatarColor: true, avatarIcon: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true, createdAt: true, avatarColor: true, avatarIcon: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const [answerCounts, logSums] = await Promise.all([
    prisma.answer.groupBy({ by: ["userId", "isCorrect"], _count: { _all: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const logsMap = new Map(logSums.map((s) => [s.userId, s._sum.amount ?? 0]));
  const correctMap = new Map<string, number>();
  const wrongMap = new Map<string, number>();
  for (const row of answerCounts) {
    if (row.isCorrect) correctMap.set(row.userId, row._count._all);
    else wrongMap.set(row.userId, row._count._all);
  }

  const rows = players.map((p) => {
    const correct = correctMap.get(p.id) ?? 0;
    const wrong = wrongMap.get(p.id) ?? 0;
    const logs = logsMap.get(p.id) ?? 0;
    return {
      ...p,
      correct,
      wrong,
      answered: correct + wrong,
      logs,
      tier: getTierForLogs(logs).label,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ash-100">Players</h1>
          <p className="text-ash-500">Every player, their answers, and their logs.</p>
        </div>
        <a
          href="/api/admin/players/export"
          download
          className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-3 py-1.5 text-xs font-medium text-ash-200 hover:border-ember-500 hover:text-ember-200"
        >
          <Download className="h-3.5 w-3.5" /> Download CSV
        </a>
      </div>

      <AdminPlayersTable rows={rows} />

      {admins.length > 0 && (
        <div>
          <SectionHeader icon={ShieldCheck} tone="navy" title="Admins" className="mb-4" />
          <div className="overflow-x-auto rounded-2xl border border-ash-900 bg-bg-card shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-panel text-ash-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-t border-ash-900 hover:bg-ash-900/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/players/${a.id}`} className="flex items-center gap-2.5 font-medium text-ember-300 hover:underline">
                        <Avatar id={a.id} name={a.name} avatarColor={a.avatarColor} avatarIcon={a.avatarIcon} />
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ash-500">{a.email}</td>
                    <td className="px-5 py-3 text-right text-ash-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
