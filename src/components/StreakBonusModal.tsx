"use client";

import { Flame, X } from "lucide-react";
import Confetti from "@/components/Confetti";

export default function StreakBonusModal({
  count,
  bonus,
  onClose,
}: {
  count: number;
  bonus: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${count} correct answers in a row`}
    >
      <div
        className="animate-pop-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-ember-500 bg-gradient-to-br from-bg-card to-navy-600 p-8 text-center shadow-glow-lg"
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

        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gold-300">Hot streak</div>

        <div className="relative mx-auto flex h-20 items-center justify-center gap-1">
          <Flame className="h-9 w-9 -rotate-6 text-ember-500/80 drop-shadow-flame" />
          <Flame className="h-14 w-14 text-ember-300 drop-shadow-flame" />
          <Flame className="h-9 w-9 rotate-6 text-ember-500/80 drop-shadow-flame" />
        </div>

        <div className="mt-2 font-display text-xl font-semibold text-white">{count} correct in a row!</div>
        <p className="mt-1 text-sm text-ash-300">You&apos;re on fire — keep the streak going.</p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ember-500/15 px-4 py-1.5 text-sm font-semibold text-ember-300">
          <Flame className="h-4 w-4" /> +{bonus} bonus logs
        </div>

        <button
          onClick={onClose}
          className="mt-6 block w-full rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
        >
          Keep it burning!
        </button>
      </div>
    </div>
  );
}
