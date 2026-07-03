export default function Badge({
  tone,
  children,
}: {
  tone: "success" | "danger" | "neutral" | "ember" | "gold" | "navy";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    neutral: "bg-navy-700/50 text-navy-100 border-navy-500",
    ember: "bg-ember-500/15 text-ember-200 border-ember-500/30",
    gold: "bg-gold-500/15 text-gold-300 border-gold-500/30",
    navy: "bg-navy-600/60 text-navy-100 border-navy-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
