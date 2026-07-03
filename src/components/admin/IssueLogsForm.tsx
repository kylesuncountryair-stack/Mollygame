"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Minus, Plus } from "lucide-react";

export default function IssueLogsForm({ playerId }: { playerId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(sign: 1 | -1) {
    setError("");
    setSuccess("");
    if (!reason.trim()) {
      setError("Please add a reason for this adjustment.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: sign * Math.abs(amount), reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setSuccess(`${sign > 0 ? "Granted" : "Removed"} ${Math.abs(amount)} logs.`);
      setReason("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ash-100">Issue or Adjust Logs</h3>
      <div className="grid gap-3 sm:grid-cols-[120px,1fr]">
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Amount</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ash-400">Reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Helped onboard a new hire"
            className="w-full rounded-lg border border-ash-800 bg-bg-panel px-3 py-2 text-sm text-ash-100"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
      {success && <p className="mt-2 text-sm text-emerald-400">{success}</p>}

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => submit(1)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-ember-500 hover:bg-ember-600 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> <Flame className="h-4 w-4" /> Grant Logs
        </button>
        <button
          onClick={() => submit(-1)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-4 py-2 text-sm font-semibold text-ash-300 hover:border-rose-500 hover:text-rose-300 disabled:opacity-50"
        >
          <Minus className="h-4 w-4" /> Remove Logs
        </button>
      </div>
    </div>
  );
}
