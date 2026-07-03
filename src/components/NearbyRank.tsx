import { Flame } from "lucide-react";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import type { LeaderboardRow } from "@/lib/leaderboard";

export default function NearbyRank({ rows, selfId }: { rows: LeaderboardRow[]; selfId: string }) {
  const selfIndex = rows.findIndex((r) => r.id === selfId);
  if (selfIndex === -1) return null;

  const start = Math.max(0, selfIndex - 2);
  const end = Math.min(rows.length, selfIndex + 3);
  const nearby = rows.slice(start, end);

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <h2 className="mb-1 font-display text-lg font-semibold text-ash-100">Your Rank</h2>
      <p className="mb-4 text-sm text-ash-500">
        #{rows[selfIndex].rank} of {rows.length} this month
      </p>
      <div className="space-y-1.5">
        {nearby.map((row) => (
          <div
            key={row.id}
            className={`flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition-colors ${
              row.id === selfId ? "border-navy-400 bg-navy-500/25" : "hover:border-ash-700 hover:bg-bg-panel"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 font-semibold text-ash-500">#{row.rank}</span>
              <Avatar id={row.id} name={row.name} />
              <span className="text-ash-100">
                {row.name}
                {row.id === selfId && <span className="text-ash-500"> (you)</span>}
              </span>
              {row.role === "ADMIN" && <Badge tone="neutral">Admin</Badge>}
            </div>
            <span className="flex items-center gap-1 font-semibold text-ash-100">
              <Flame className="h-3.5 w-3.5 text-ember-400" />
              {row.monthlyLogs}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
