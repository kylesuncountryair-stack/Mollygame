export default function Badge({ tone, children }: { tone: "success" | "danger" | "neutral" | "ember"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    neutral: "bg-ash-900 text-ash-300 border-ash-700",
    ember: "bg-ember-500/15 text-ember-200 border-ember-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
