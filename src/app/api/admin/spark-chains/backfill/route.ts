import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { resetAndRebuildSparkChains } from "@/lib/sparkChain";

// One-time (but safe to re-run) reconciliation against the current
// round-based spark chain rule (capped at one spark per pair per round of
// questions, matched on the round's scheduled date rather than the exact
// question or the day it was answered). Wipes existing spark chain history
// (SparkChain rows and SPARK_CHAIN-type log transactions only — nothing
// else is touched) and rebuilds it from scratch by replaying answer
// history through the current logic. This also claws back any excess logs
// handed out by a short-lived earlier version of this feature that
// sparked once per question instead of once per round. See
// resetAndRebuildSparkChains() for details — it's idempotent, so
// triggering this more than once always lands on the same correct state.
export async function POST() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await resetAndRebuildSparkChains();
  return NextResponse.json(result);
}
