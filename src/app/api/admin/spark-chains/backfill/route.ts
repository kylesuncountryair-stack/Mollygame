import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/session";
import { backfillSparkChains } from "@/lib/sparkChain";

// One-time (but safe to re-run) reconciliation after switching spark chains
// from "answered something correctly the same day" to "answered this SAME
// question correctly." Replays answer history through the new matching
// logic and awards any sparks that would have happened under the new rule
// but didn't. See backfillSparkChains() for details — it's idempotent, so
// triggering this more than once won't double-award anything.
export async function POST() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await backfillSparkChains();
  return NextResponse.json(result);
}
