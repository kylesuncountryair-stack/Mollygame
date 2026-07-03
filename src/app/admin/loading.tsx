import Skeleton from "@/components/Skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
