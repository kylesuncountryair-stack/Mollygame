"use client";

import { X } from "lucide-react";
import { FlameGlyph } from "@/components/BonfireVisual";
import Confetti from "@/components/Confetti";

export default function TierUpBanner({ tier, onClose }: { tier: { label: string }; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`You reached the ${tier.label} tier`}
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

        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gold-300">Tier up</div>

        <svg viewBox="0 0 200 140" className="mx-auto h-28 w-28 drop-shadow-flame">
          <defs>
            <radialGradient id="flameCoreTierUp" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff3e0" />
              <stop offset="28%" stopColor="#ffd27a" />
              <stop offset="55%" stopColor="#fb9450" />
              <stop offset="80%" stopColor="#f58232" />
              <stop offset="100%" stopColor="#b8530f" />
            </radialGradient>
          </defs>
          <FlameGlyph cx={100} groundY={120} scale={1.1} gradientId="flameCoreTierUp" />
        </svg>

        <div className="mt-2 font-display text-xl font-semibold text-white">You just became a {tier.label}!</div>
        <p className="mt-1 text-sm text-ash-300">Keep answering to climb even higher.</p>

        <button
          onClick={onClose}
          className="mt-5 rounded-lg bg-ember-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ember-600"
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
