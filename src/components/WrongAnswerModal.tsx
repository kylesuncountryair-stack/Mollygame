"use client";

import { X, XCircle } from "lucide-react";

export default function WrongAnswerModal({
  correctAnswer,
  explanation,
  onClose,
}: {
  correctAnswer: string;
  explanation?: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Answer explanation"
    >
      <div
        className="animate-pop-in relative w-full max-w-sm rounded-2xl border border-rose-500/40 bg-bg-card p-8 text-center shadow-glow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1 text-ash-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
          <XCircle className="h-6 w-6" />
        </span>

        <h2 className="mt-4 font-display text-lg font-semibold text-white">Not quite</h2>
        <p className="mt-2 text-sm text-ash-300">
          The correct answer was <span className="font-semibold text-ash-100">{correctAnswer}</span>.
        </p>
        {explanation && <p className="mt-3 rounded-lg bg-bg-panel p-3 text-sm text-ash-300">{explanation}</p>}

        <button
          onClick={onClose}
          className="mt-6 rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
