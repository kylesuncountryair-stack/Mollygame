import { Flame, Medal } from "lucide-react";
import Badge from "@/components/Badge";

export type LeaderboardRow = {
  id: string;
  rank: number;
  name: string;
  role?: "PLAYER" | "ADMIN";
  monthlyLogs: number;
  allTimeLogs: number;
  tier: string;
};

const medalColor: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

export default function LeaderboardTable({ rows, highlightId }: { rows: LeaderboardRow[]; highlightId?: string }) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">No one on the board yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-panel text-ash-500">
          <tr>
            <th className="px-5 py-3 font-medium">Rank</th>
            <th className="px-5 py-3 font-medium">Player</th>
            <th className="px-5 py-3 font-medium">Tier</th>
            <th className="px-5 py-3 font-medium text-right">Logs this month</th>
            <th className="px-5 py-3 font-medium text-right">All-time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={`border-t border-ash-900 ${r.id === highlightId ? "bg-ember-500/10" : ""}`}
            >
              <td className="px-5 py-3">
                <span className={`flex items-center gap-1 font-semibold ${medalColor[r.rank] ?? "text-ash-300"}`}>
                  {r.rank <= 3 ? <Medal className="h-4 w-4" /> : null}#{r.rank}
                </span>
              </td>
              <td className="px-5 py-3 text-ash-100">
                <span className="flex items-center gap-2">
                  {r.name}
                  {r.role === "ADMIN" && <Badge tone="neutral">Admin</Badge>}
                </span>
              </td>
              <td className="px-5 py-3 text-ember-300">{r.tier}</td>
              <td className="px-5 py-3 text-right font-semibold text-ash-100">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-ember-400" />
                  {r.monthlyLogs}
                </span>
              </td>
              <td className="px-5 py-3 text-right text-ash-500">{r.allTimeLogs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
