// Shared pulsing placeholder block. Used both by Next.js's route-level
// loading.tsx files (shown automatically while a server component's data
// fetch is in flight) and by client components with their own fetch-on-mount
// loading state, so skeletons look identical everywhere instead of some
// being gray blocks and others being "Loading..." text.
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-navy-600/40 ${className}`} />;
}
