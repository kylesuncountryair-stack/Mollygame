"use client";

import { BONFIRE_TIERS } from "@/lib/bonfire";
import { FlameGlyph, Logs } from "@/components/BonfireVisual";

const COL_WIDTH = 200;
const GROUND_Y = 168;
const VIEW_HEIGHT = 230;

export default function BonfireTierGuide() {
  const width = COL_WIDTH * BONFIRE_TIERS.length;

  return (
    <div className="rounded-2xl border border-ash-900 bg-bg-card shadow-card p-6">
      <h2 className="mb-1 font-display text-lg font-semibold text-ash-100">Every Phase of the Bonfire</h2>
      <p className="mb-4 text-sm text-ash-500">Your fire grows as you earn logs this month. Here's what's ahead.</p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${VIEW_HEIGHT}`}
          className="h-auto"
          style={{ width: "100%", minWidth: width * 0.6 }}
        >
          <defs>
            <radialGradient id="flameCoreGuide" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff3e0" />
              <stop offset="28%" stopColor="#ffd27a" />
              <stop offset="55%" stopColor="#fb9450" />
              <stop offset="80%" stopColor="#f58232" />
              <stop offset="100%" stopColor="#b8530f" />
            </radialGradient>
            <radialGradient id="glowGuide" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="#f58232" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f58232" stopOpacity="0" />
            </radialGradient>
          </defs>

          {BONFIRE_TIERS.map((tier, i) => {
            const cx = COL_WIDTH * i + COL_WIDTH / 2;
            const glowR = 40 + tier.flameScale * 34;
            return (
              <g key={tier.key}>
                <circle cx={cx} cy={GROUND_Y - 50} r={glowR} fill="url(#glowGuide)" />
                {tier.doubleGlow && (
                  <circle cx={cx} cy={GROUND_Y - 50} r={glowR * 0.68} fill="url(#glowGuide)" opacity={0.7} />
                )}

                <ellipse cx={cx} cy={GROUND_Y + 6} rx={16 + tier.logCount * 5} ry={5} fill="#081226" />

                <Logs cx={cx} groundY={GROUND_Y} count={tier.logCount} />

                <g className="drop-shadow-flame">
                  {tier.sideFlames.map((sf, si) => (
                    <FlameGlyph
                      key={si}
                      cx={cx + sf.dx}
                      groundY={GROUND_Y}
                      scale={sf.scale}
                      rotate={sf.rotate}
                      opacity={sf.opacity}
                      gradientId="flameCoreGuide"
                      animated={false}
                    />
                  ))}

                  <FlameGlyph
                    cx={cx}
                    groundY={GROUND_Y}
                    scale={tier.flameScale}
                    gradientId="flameCoreGuide"
                    animated={false}
                  />
                </g>

                <text
                  x={cx}
                  y={GROUND_Y + 40}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontSize="15"
                  fontWeight={700}
                  fill="#f5f7fb"
                >
                  {tier.label}
                </text>
                <text
                  x={cx}
                  y={GROUND_Y + 58}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontSize="11"
                  fill="#7d93b8"
                >
                  {tier.min}+ logs
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
