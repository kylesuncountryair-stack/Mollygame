import Skeleton from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto,1fr]">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-ash-900 bg-bg-card p-8">
          <Skeleton className="h-28 w-28 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="mt-3 h-8 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="overflow-hidden rounded-2xl border border-ash-900 bg-bg-card">
          <div className="divide-y divide-ash-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="ml-auto h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
