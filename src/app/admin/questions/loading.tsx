import Skeleton from "@/components/Skeleton";

export default function AdminQuestionsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="space-y-4 rounded-2xl border border-ash-900 bg-bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div>
        <Skeleton className="mb-3 h-5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ash-900 bg-bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
