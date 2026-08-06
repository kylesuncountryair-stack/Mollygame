"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

type Result = { removedSparkChains: number; removedLogTransactions: number; checked: number; created: number };

// One-time (but safe to re-run) admin action to reconcile spark chains
// against the current round-based rule (both people answering correctly
// somewhere in the same round of questions, capped at one spark per pair
// per round). Wipes existing spark chain history — SparkChain rows and
// SPARK_CHAIN-type log transactions only, nothing else — and rebuilds it
// from scratch by replaying answer history through the current logic.
// This also claws back any excess logs an earlier, short-lived version of
// this feature handed out by sparking once per question instead of once
// per round. Safe to run more than once: it always lands on the same
// correct end state.
export default function SparkChainBackfillButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (
      !confirm(
        "This clears out existing spark chain logs and recomputes them from scratch under the current rule (one spark per pair per round). Any player over-awarded by the earlier per-question version will have the excess removed. Continue?"
      )
    )
      return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/spark-chains/backfill", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <SectionHeader
        icon={Sparkles}
        tone="gold"
        title="Reset & Rebuild Spark Chains"
        subtitle="Clears existing spark chain logs and recomputes them from scratch — one spark per pair per round, even across different answer days. Corrects any over-awards from the earlier per-question version. Safe to run more than once."
        as="h3"
        className="mb-4"
      />
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-ember-500 hover:bg-ember-600 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" /> {loading ? "Running..." : "Reset & Rebuild"}
      </button>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      {result && (
        <p className="mt-3 text-sm text-emerald-400">
          Cleared {result.removedSparkChains} old spark chain{result.removedSparkChains === 1 ? "" : "s"} (
          {result.removedLogTransactions} log{result.removedLogTransactions === 1 ? "" : "s"}) — checked {result.checked}{" "}
          correct answers and rebuilt {result.created} spark chain{result.created === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
