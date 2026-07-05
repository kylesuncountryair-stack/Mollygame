import Skeleton from "@/components/Skeleton";

export default function HistoryLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-3 w-56" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 rounded-xl px-4 py-2.5">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
