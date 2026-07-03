"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Trash2, UserPlus, Users } from "lucide-react";
import Badge from "@/components/Badge";

type FriendRow = {
  id: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  monthlyLogs: number;
  allTimeLogs: number;
  tier: string;
};

type Candidate = { id: string; name: string; email: string };

export default function FriendsWidget({
  me,
}: {
  me: { id: string; name: string; monthlyLogs: number; allTimeLogs: number; tier: string };
}) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendRow[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadFriends() {
    const res = await fetch("/api/friends");
    const data = await res.json();
    setFriends(data.friends ?? []);
  }

  async function loadCandidates() {
    const res = await fetch("/api/friends/candidates");
    const data = await res.json();
    setCandidates(data.candidates ?? []);
  }

  useEffect(() => {
    loadFriends();
    loadCandidates();
  }, []);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSelected("");
      await Promise.all([loadFriends(), loadCandidates()]);
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function removeFriend(id: string) {
    setRemovingId(id);
    try {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      await Promise.all([loadFriends(), loadCandidates()]);
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  const combined = [{ ...me, role: "PLAYER" as const, isMe: true }, ...(friends ?? []).map((f) => ({ ...f, isMe: false }))].sort(
    (a, b) => b.monthlyLogs - a.monthlyLogs
  );

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-ember-400" />
        <h2 className="font-display text-lg font-semibold text-ash-100">Your Circle</h2>
      </div>

      {friends === null ? (
        <p className="text-sm text-ash-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {combined.map((row, i) => (
            <div
              key={row.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
                row.isMe ? "border-ember-500/40 bg-ember-500/10" : "border-ash-800 bg-bg-panel"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-sm font-semibold text-ash-500">#{i + 1}</span>
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

      <form onSubmit={addFriend} className="mt-4 flex items-center gap-2 border-t border-ash-900 pt-4">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
        >
          <option value="">Add someone to your circle...</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!selected || adding}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-ember-500 to-ember-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          <UserPlus className="h-4 w-4" /> Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      {candidates.length === 0 && friends !== null && friends.length > 0 && (
        <p className="mt-2 text-xs text-ash-500">Everyone else is already in your circle.</p>
      )}
    </div>
  );
}
