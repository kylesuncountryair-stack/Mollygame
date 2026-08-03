"use client";

import { Gift, X } from "lucide-react";
import Confetti from "@/components/Confetti";

export default function BonusUnlockedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bonus question unlocked"
    >
      <div
        className="animate-pop-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-navy-300 bg-gradient-to-br from-bg-card to-navy-600 p-8 text-center shadow-glow-lg"
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

        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-navy-200">First today</div>

        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy-300/15 text-navy-200">
          <Gift className="h-8 w-8" />
        </span>

        <div className="mt-3 font-display text-xl font-semibold text-white">Bonus question unlocked!</div>
        <p className="mt-1 text-sm text-ash-300">
          You were first to answer today. A bonus question worth extra logs is waiting for you below.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy-300/15 px-4 py-1.5 text-sm font-semibold text-navy-200">
          <Gift className="h-4 w-4" /> +3 logs up for grabs
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
