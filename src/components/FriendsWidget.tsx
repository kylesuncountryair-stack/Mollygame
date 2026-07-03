"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Trash2, UserPlus, Users } from "lucide-react";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";

type FriendRow = {
  id: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  monthlyLogs: number;
  allTimeLogs: number;
  tier: string;
};

export default function FriendsWidget({
  me,
}: {
  me: { id: string; name: string; monthlyLogs: number; allTimeLogs: number; tier: string };
}) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendRow[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadFriends() {
    const res = await fetch("/api/friends");
    const data = await res.json();
    setFriends(data.friends ?? []);
  }

  useEffect(() => {
    loadFriends();
  }, []);

  async function removeFriend(id: string) {
    setRemovingId(id);
    try {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      await loadFriends();
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  const combined = [{ ...me, role: "PLAYER" as const, isMe: true }, ...(friends ?? []).map((f) => ({ ...f, isMe: false }))].sort(
    (a, b) => b.monthlyLogs - a.monthlyLogs
  );

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <div className="mb-1 flex items-center gap-2">
        <Users className="h-5 w-5 text-ember-400" />
        <h2 className="font-display text-lg font-semibold text-ash-100">Your Circle</h2>
      </div>

      {friends === null ? (
        <p className="mt-3 text-sm text-ash-500">Loading...</p>
      ) : friends.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-ash-700 p-4 text-sm text-ash-500">
          You haven&apos;t added anyone yet.{" "}
          <Link href="/leaderboard" className="text-ember-300 underline">
            Add people from the Leaderboard
          </Link>{" "}
          to track them here.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {combined.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 transition-colors ${
                row.isMe ? "border-navy-400 bg-navy-500/25" : "border-ash-700 bg-bg-panel hover:border-ash-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-sm font-semibold text-ash-500">#{i + 1}</span>
                <Avatar id={row.id} name={row.name} />
                <span className="text-sm font-medium text-ash-100">
                  {row.name}
                  {row.isMe && <span className="text-ash-500"> (you)</span>}
                </span>
                {row.role === "ADMIN" && <Badge tone="neutral">Admin</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm font-semibold text-ash-100">
                  <Flame className="h-3.5 w-3.5 text-ember-400" />
                  {row.monthlyLogs}
                </span>
                {!row.isMe && (
                  <button
                    onClick={() => removeFriend(row.id)}
                    disabled={removingId === row.id}
                    className="text-ash-500 hover:text-rose-400 disabled:opacity-40"
                    aria-label={`Remove ${row.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/leaderboard"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-ash-700 py-2 text-sm font-medium text-ash-300 hover:border-ember-500 hover:text-ember-200"
      >
        <UserPlus className="h-4 w-4" /> Add someone from the Leaderboard
      </Link>
    </div>
  );
}
