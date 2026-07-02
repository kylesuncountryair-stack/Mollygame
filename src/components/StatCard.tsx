import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card p-5">
      <div className="flex items-center gap-2 text-ash-300">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-ash-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-ash-500">{hint}</div>}
    </div>
  );
}
