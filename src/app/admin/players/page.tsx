import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfMonthCT, getTierForLogs } from "@/lib/bonfire";
import Avatar from "@/components/Avatar";

export default async function AdminPlayersPage() {
  const [players, admins] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PLAYER" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const [answerCounts, allTimeSums, monthlySums] = await Promise.all([
    prisma.answer.groupBy({ by: ["userId", "isCorrect"], _count: { _all: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], _sum: { amount: true } }),
    prisma.logTransaction.groupBy({ by: ["userId"], where: { createdAt: { gte: startOfMonthCT() } }, _sum: { amount: true } }),
  ]);

  const allTimeMap = new Map(allTimeSums.map((s) => [s.userId, s._sum.amount ?? 0]));
  const monthlyMap = new Map(monthlySums.map((s) => [s.userId, s._sum.amount ?? 0]));
  const correctMap = new Map<string, number>();
  const wrongMap = new Map<string, number>();
  for (const row of answerCounts) {
    if (row.isCorrect) correctMap.set(row.userId, row._count._all);
    else wrongMap.set(row.userId, row._count._all);
  }

  const rows = players.map((p) => {
    const correct = correctMap.get(p.id) ?? 0;
    const wrong = wrongMap.get(p.id) ?? 0;
    const monthlyLogs = monthlyMap.get(p.id) ?? 0;
    return {
      ...p,
      correct,
      wrong,
      answered: correct + wrong,
      allTimeLogs: allTimeMap.get(p.id) ?? 0,
      monthlyLogs,
      tier: getTierForLogs(monthlyLogs).label,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Players</h1>
        <p className="text-ash-500">Every player, their answers, and their logs.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">No players yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ash-900 bg-bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-panel text-ash-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium text-right">Answered</th>
                <th className="px-5 py-3 font-medium text-right">Correct</th>
                <th className="px-5 py-3 font-medium text-right">Wrong</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium text-right">Logs (month)</th>
                <th className="px-5 py-3 font-medium text-right">Logs (all-time)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ash-900 hover:bg-ash-900/40">
                  <td className="px-5 py-3">
                    <Link href={`/admin/players/${r.id}`} className="flex items-center gap-2.5 font-medium text-ember-300 hover:underline">
                      <Avatar id={r.id} name={r.name} />
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ash-500">{r.email}</td>
                  <td className="px-5 py-3 text-right text-ash-100">{r.answered}</td>
                  <td className="px-5 py-3 text-right text-emerald-400">{r.correct}</td>
                  <td className="px-5 py-3 text-right text-rose-400">{r.wrong}</td>
                  <td className="px-5 py-3 text-ash-300">{r.tier}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ash-100">{r.monthlyLogs}</td>
                  <td className="px-5 py-3 text-right text-ash-500">{r.allTimeLogs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {admins.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-ash-100">Admins</h2>
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
                        <Avatar id={a.id} name={a.name} />
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
