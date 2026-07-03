import { NextResponse } from "next/server";
import { getLeaderboardRows } from "@/lib/leaderboard";

// Without this, Next.js statically caches this route at build time since it
// doesn't read cookies/headers — meaning it would keep serving the same
// snapshot forever instead of live standings.
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getLeaderboardRows();
  return NextResponse.json({ rows });
}
