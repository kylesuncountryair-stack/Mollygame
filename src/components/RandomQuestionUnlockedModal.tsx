"use client";

import { Dices, X } from "lucide-react";
import Confetti from "@/components/Confetti";

export default function RandomQuestionUnlockedModal({ logsReward, onClose }: { logsReward: number; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Random question unlocked"
    >
      <div
        className="animate-pop-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-400 bg-gradient-to-br from-bg-card to-emerald-900/40 p-8 text-center shadow-glow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1 text-ash-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-300">Lucky pick</div>

        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <Dices className="h-8 w-8" />
        </span>

        <div className="mt-3 font-display text-xl font-semibold text-white">
          You've been randomly selected for an extra bonus question!
        </div>
        <p className="mt-1 text-sm text-ash-300">
          You&apos;re one of today&apos;s random picks. A bonus question is waiting for you below.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-semibold text-emerald-300">
          <Dices className="h-4 w-4" /> +{logsReward} logs up for grabs
        </div>

        <button
          onClick={onClose}
          className="mt-6 block w-full rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
        >
          Let&apos;s go!
        </button>
      </div>
    </div>
  );
}
