import Skeleton from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px,1fr,1fr]">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-ash-900 bg-bg-card p-8">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-ash-700 bg-bg-card px-2 py-3">
                <Skeleton className="mx-auto h-7 w-7 rounded-full" />
                <Skeleton className="mx-auto mt-2 h-5 w-8" />
                <Skeleton className="mx-auto mt-1 h-3 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ash-900 bg-bg-card p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
            <div className="mt-4 space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-ash-900 bg-bg-card p-6">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-4 h-6 w-full" />
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} className="h-11 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="mt-4 h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
