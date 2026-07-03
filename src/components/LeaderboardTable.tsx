"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Medal, Trophy, UserCheck, UserPlus } from "lucide-react";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";

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
  1: "text-gold-400",
  2: "text-navy-100",
  3: "text-ember-600",
};

export default function LeaderboardTable({
  rows,
  highlightId,
  followingIds = [],
}: {
  rows: LeaderboardRow[];
  highlightId?: string;
  followingIds?: string[];
}) {
  const router = useRouter();
  const [following, setFollowing] = useState<Set<string>>(new Set(followingIds));
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleFollow(id: string) {
    setPendingId(id);
    const isFollowing = following.has(id);
    try {
      if (isFollowing) {
        await fetch(`/api/friends/${id}`, { method: "DELETE" });
        setFollowing((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: id }),
        });
        if (res.ok) {
          setFollowing((prev) => new Set(prev).add(id));
        }
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ash-700 p-8 text-center text-ash-500">
        <Trophy className="h-6 w-6 text-ash-600" />
        <p>No one on the board yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ash-900 bg-bg-card shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-bg-panel text-ash-500">
          <tr>
            <th className="px-5 py-3 font-medium">Rank</th>
            <th className="px-5 py-3 font-medium">Player</th>
            <th className="px-5 py-3 font-medium">Tier</th>
            <th className="px-5 py-3 font-medium text-right">Logs this month</th>
            <th className="px-5 py-3 font-medium text-right">All-time</th>
            {highlightId && <th className="px-5 py-3 font-medium text-right">Circle</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isSelf = r.id === highlightId;
            return (
              <tr
                key={r.id}
                className={`border-t border-ash-900 transition-colors ${
                  isSelf ? "bg-gradient-to-r from-navy-300/20 to-navy-300/5" : "hover:bg-bg-panel/60"
                }`}
              >
                <td className="px-5 py-3">
                  <span className={`flex items-center gap-1 font-semibold ${medalColor[r.rank] ?? "text-ash-300"}`}>
                    {r.rank <= 3 ? <Medal className="h-4 w-4" /> : null}#{r.rank}
                  </span>
                </td>
                <td className="px-5 py-3 text-white">
                  <span className="flex items-center gap-2.5">
                    <Avatar id={r.id} name={r.name} />
                    {r.name}
                    {isSelf && <span className="text-xs text-ash-500">(you)</span>}
                    {r.role === "ADMIN" && <Badge tone="neutral">Admin</Badge>}
                  </span>
                </td>
                <td className="px-5 py-3 text-gold-300">{r.tier}</td>
                <td className="px-5 py-3 text-right font-semibold text-ember-400">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" />
                    {r.monthlyLogs}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-ash-500">{r.allTimeLogs}</td>
                {highlightId && (
                  <td className="px-5 py-3 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => toggleFollow(r.id)}
                        disabled={pendingId === r.id}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                          following.has(r.id)
                            ? "border-navy-400 bg-navy-500/20 text-navy-100 hover:border-rose-500 hover:text-rose-300"
                            : "border-ash-700 text-ash-200 hover:border-ember-500 hover:text-ember-200"
                        }`}
                      >
                        {following.has(r.id) ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
