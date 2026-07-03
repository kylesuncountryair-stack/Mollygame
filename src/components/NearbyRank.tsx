import { Award, Flame } from "lucide-react";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import SectionHeader from "@/components/SectionHeader";
import type { LeaderboardRow } from "@/lib/leaderboard";

export default function NearbyRank({ rows, selfId }: { rows: LeaderboardRow[]; selfId: string }) {
  const selfIndex = rows.findIndex((r) => r.id === selfId);
  if (selfIndex === -1) return null;

  const start = Math.max(0, selfIndex - 2);
  const end = Math.min(rows.length, selfIndex + 3);
  const nearby = rows.slice(start, end);

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <SectionHeader
        icon={Award}
        tone="gold"
        title="Your Rank"
        subtitle={`#${rows[selfIndex].rank} of ${rows.length} this month`}
        className="mb-4"
      />
      <div className="space-y-1.5">
        {nearby.map((row) => (
          <div
            key={row.id}
            className={`flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-all ${
              row.id === selfId
                ? "scale-[1.02] border-navy-300 bg-gradient-to-r from-navy-300/20 to-navy-300/5 shadow-[0_4px_14px_rgba(74,158,255,0.15)]"
                : "hover:border-ash-700 hover:bg-bg-panel"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 font-semibold text-ash-500">#{row.rank}</span>
              <Avatar id={row.id} name={row.name} avatarColor={row.avatarColor} avatarIcon={row.avatarIcon} />
              <span className={row.id === selfId ? "font-medium text-white" : "text-ash-100"}>
                {row.name}
                {row.id === selfId && <span className="text-ash-300"> (you)</span>}
              </span>
              {row.role === "ADMIN" && <Badge tone="neutral">Admin</Badge>}
            </div>
            <span className="flex items-center gap-1 font-semibold text-ember-400">
              <Flame className="h-3.5 w-3.5" />
              {row.monthlyLogs}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
