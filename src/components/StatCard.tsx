import type { LucideIcon } from "lucide-react";

const TONES = {
  ember: "bg-ember-500/15 text-ember-400",
  gold: "bg-gold-500/15 text-gold-400",
  navy: "bg-navy-300/15 text-navy-300",
  success: "bg-emerald-500/15 text-emerald-400",
  danger: "bg-rose-500/15 text-rose-400",
} as const;

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "ember",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-5">
      <div className="flex items-center gap-2.5 text-ash-300">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${TONES[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-ash-500">{hint}</div>}
    </div>
  );
}
