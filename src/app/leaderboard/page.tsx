import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { monthLabel } from "@/lib/bonfire";
import { getLeaderboardRows } from "@/lib/leaderboard";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function LeaderboardPage() {
  const session = await getCurrentSession();

  const [rows, follows] = await Promise.all([
    getLeaderboardRows(),
    session
      ? prisma.follow.findMany({ where: { followerId: session.sub }, select: { followingId: true } })
      : Promise.resolve([]),
  ]);

  const followingIds = follows.map((f) => f.followingId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ash-100">Leaderboard</h1>
        <p className="text-ash-500">
          Biggest bonfires for {monthLabel()} &middot; add people to your circle with the button on the right
        </p>
      </div>
      <LeaderboardTable rows={rows} highlightId={session?.sub} followingIds={followingIds} />
    </div>
  );
}
