import Skeleton from "@/components/Skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
        <div className="border-b border-ash-900 bg-bg-panel px-5 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-ash-900">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
