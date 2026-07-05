import Skeleton from "@/components/Skeleton";

export default function AdminReportsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-ash-900 bg-bg-card p-6">
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
        <div className="border-b border-ash-900 bg-bg-panel px-5 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-ash-900">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-10" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
