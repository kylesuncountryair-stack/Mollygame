import type { LucideIcon } from "lucide-react";

const TONES = {
  ember: "bg-ember-500/15 text-ember-400",
  gold: "bg-gold-500/15 text-gold-400",
  navy: "bg-navy-300/15 text-navy-300",
  success: "bg-emerald-500/15 text-emerald-400",
  danger: "bg-rose-500/15 text-rose-400",
} as const;

// A consistent "icon in a tinted circle + title (+ optional subtitle)"
// header, reusing the same badge treatment as StatCard/the dashboard mini
// stats — one recurring motif instead of some sections having an icon and
// others being bare text.
export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  tone = "ember",
  as = "h2",
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: keyof typeof TONES;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const HeadingTag = as;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <HeadingTag className="font-display text-lg font-semibold text-white">{title}</HeadingTag>
        {subtitle && <p className="text-xs text-ash-500">{subtitle}</p>}
      </div>
    </div>
  );
}
