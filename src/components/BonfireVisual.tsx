"use client";

import { getTierForLogs, nextTierProgress } from "@/lib/bonfire";

export default function BonfireVisual({ logs, size = "lg" }: { logs: number; size?: "sm" | "lg" }) {
  const tier = getTierForLogs(logs);
  const { next, progress } = nextTierProgress(logs);
  const dims = size === "lg" ? 220 : 120;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative flex items-end justify-center rounded-full ${tier.glowClass}`}
        style={{ width: dims, height: dims }}
      >
        {/* embers */}
        {size === "lg" &&
          Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-10 h-1.5 w-1.5 rounded-full bg-ember-300 animate-ember"
              style={{
                left: `${20 + i * 12}%`,
                animationDelay: `${i * 0.45}s`,
                // @ts-expect-error css var
                "--drift": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
              }}
            />
          ))}

        <svg
          viewBox="0 0 100 130"
          className="animate-flicker"
          style={{ width: dims * tier.flameScale, height: dims * tier.flameScale * 1.3 }}
        >
          <defs>
            <radialGradient id="flameCore" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff4e6" />
              <stop offset="35%" stopColor="#ffc078" />
              <stop offset="70%" stopColor="#ff7f2a" />
              <stop offset="100%" stopColor="#c0330d" />
            </radialGradient>
          </defs>
          <path
            fill="url(#flameCore)"
            d="M50 10 C 20 40, 15 65, 30 85 C 25 70, 35 60, 40 55 C 38 75, 50 90, 50 100 C 78 90, 90 65, 75 40 C 78 55, 65 60, 62 50 C 70 35, 65 15, 50 10 Z"
          />
          <path
            fill="#ffe3bf"
            opacity="0.85"
            d="M50 55 C 40 65, 38 80, 48 92 C 44 82, 50 75, 52 70 C 55 80, 62 82, 58 92 C 68 82, 66 65, 55 58 C 56 62, 52 62, 50 55 Z"
          />
        </svg>
      </div>

      <div className="text-center">
        <div className="font-display text-2xl font-bold text-ember-200">{tier.label}</div>
        <div className="text-sm text-ash-300">{logs} logs this month</div>
        {next && (
          <div className="mt-2 w-40">
            <div className="h-2 w-full overflow-hidden rounded-full bg-ash-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-300 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-ash-500">{next.min - logs} logs to {next.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}
