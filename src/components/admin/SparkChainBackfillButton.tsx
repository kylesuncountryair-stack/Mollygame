"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

// One-time (but safe to re-run) admin action after switching spark chains
// from "answered something correctly the same day" to "answered this SAME
// question correctly." Replays answer history through the new rule and
// awards any sparks that would have happened under it but didn't — safe to
// click more than once, it won't double-award anything already sparked.
export default function SparkChainBackfillButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ checked: number; created: number } | null>(null);

  async function run() {
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
        title="Spark Chain Backfill"
        subtitle="Retroactively awards spark chains for coworkers who answered the same question correctly, even on different days. Safe to run more than once."
        as="h3"
        className="mb-4"
      />
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-ember-500 hover:bg-ember-600 px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" /> {loading ? "Running..." : "Run Backfill"}
      </button>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      {result && (
        <p className="mt-3 text-sm text-emerald-400">
          Checked {result.checked} correct answers — awarded {result.created} new spark chain
          {result.created === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
