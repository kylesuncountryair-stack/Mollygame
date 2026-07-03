import { getCurrentSession } from "@/lib/session";
import { monthLabel } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function LeaderboardPage() {
  const session = await getCurrentSession();
  const rows = await getLeaderboardRows();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Leaderboard</h1>
        <p className="text-ash-500">Biggest bonfires for {monthLabel()}</p>
      </div>
      <LeaderboardTable rows={rows} highlightId={session?.sub} />
    </div>
  );
}
