"use client";

import { useState } from "react";
import { Flame, Award, Sparkles, Users, X } from "lucide-react";

type Step = {
  icon: typeof Flame;
  tone: "ember" | "gold" | "navy";
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Flame,
    tone: "ember",
    title: "Welcome to the Bonfire Challenge",
    body: "Answer daily and weekly questions to earn logs and build your bonfire. It's a one-month game — every log counts toward your final standing.",
  },
  {
    icon: Award,
    tone: "gold",
    title: "Grow through tiers",
    body: "Your bonfire climbs through six tiers as you collect logs — from Spark all the way up to Wildfire. Check the tier guide on your dashboard any time.",
  },
  {
    icon: Flame,
    tone: "ember",
    title: "Keep your streak alive",
    body: "Answering the daily question correctly, day after day, builds a streak shown right on your dashboard. Don't let it fizzle out.",
  },
  {
    icon: Sparkles,
    tone: "gold",
    title: "Spark chains",
    body: "When you and someone in your circle both answer correctly on the same day, you each get a bonus log — up to one spark per day.",
  },
  {
    icon: Users,
    tone: "navy",
    title: "Build your circle",
    body: "Add people from the Leaderboard to your circle to track them on your dashboard and unlock spark chains together.",
  },
];

const TONE_CLASSES: Record<Step["tone"], string> = {
  ember: "bg-ember-500/15 text-ember-300",
  gold: "bg-gold-500/15 text-gold-300",
  navy: "bg-navy-300/15 text-navy-300",
};

export default function OnboardingTour({ initialSeen }: { initialSeen: boolean }) {
  const [dismissed, setDismissed] = useState(initialSeen);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  if (dismissed) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  async function finish() {
    setSaving(true);
    setDismissed(true);
    try {
      await fetch("/api/account/onboarding", { method: "PATCH" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="animate-pop-in relative w-full max-w-sm rounded-2xl border border-ash-800 bg-bg-card p-8 text-center shadow-glow-lg">
        <button
          onClick={finish}
          disabled={saving}
          aria-label="Skip tour"
          className="absolute right-3 top-3 rounded-lg p-1 text-ash-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${TONE_CLASSES[current.tone]}`}>
          <Icon className="h-6 w-6" />
        </span>

        <h2 className="mt-4 font-display text-lg font-semibold text-white">{current.title}</h2>
        <p className="mt-2 text-sm text-ash-300">{current.body}</p>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-ember-400" : "w-1.5 bg-ash-700"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ash-400 hover:text-ash-200 disabled:opacity-0"
          >
            Back
          </button>
          {isLast ? (
            <button
              onClick={finish}
              disabled={saving}
              className="rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600 disabled:opacity-50"
            >
              Let&apos;s go!
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
