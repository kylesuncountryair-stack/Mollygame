"use client";

import { getTierForLogs, nextTierProgress, type SideFlame } from "@/lib/bonfire";

// Original flame silhouette's own bounding box is x:[15,90] y:[10,100], so its
// bottom-center is (52.5, 100). Anchoring every flame instance's transform to
// that point (rather than scaling from the SVG's (0,0) origin) means the
// flame grows straight up from a fixed base at any scale, instead of
// drifting sideways as it gets bigger.
export const FLAME_D =
  "M50 10 C 20 40, 15 65, 30 85 C 25 70, 35 60, 40 55 C 38 75, 50 90, 50 100 C 78 90, 90 65, 75 40 C 78 55, 65 60, 62 50 C 70 35, 65 15, 50 10 Z";
export const FLAME_ANCHOR_X = 52.5;
export const FLAME_ANCHOR_Y = 100;

export function flameTransform(cx: number, groundY: number, scale: number, rotate = 0) {
  return `translate(${cx},${groundY}) translate(${FLAME_ANCHOR_X},${FLAME_ANCHOR_Y}) rotate(${rotate}) scale(${scale}) translate(${-FLAME_ANCHOR_X},${-FLAME_ANCHOR_Y})`;
}

export function FlameGlyph({
  cx,
  groundY,
  scale,
  rotate = 0,
  opacity = 1,
  gradientId,
  animated = true,
}: {
  cx: number;
  groundY: number;
  scale: number;
  rotate?: number;
  opacity?: number;
  gradientId: string;
  animated?: boolean;
}) {
  return (
    // Positioning lives on this outer <g> as an SVG "transform" attribute.
    // The flicker wobble is applied via a CSS animation on a nested inner
    // <g> instead of this one — a CSS `transform` (even from an animation)
    // replaces an element's SVG transform attribute rather than composing
    // with it, so putting both on the same node would silently break the
    // anchored positioning every time the flicker keyframe ticked.
    <g transform={flameTransform(cx, groundY, scale, rotate)} opacity={opacity}>
      <g className={animated ? "animate-flicker" : ""}>
        <path fill={`url(#${gradientId})`} d={FLAME_D} />
      </g>
    </g>
  );
}

export const LOG_ROTATIONS = [-10, 10, 0, -4, 5, -13];
export const LOG_COLORS = ["#6b4226", "#7a4d2b"];

export function Logs({ cx, groundY, count }: { cx: number; groundY: number; count: number }) {
  if (count === 0) return null;
  const width = 46 + count * 8;
  const height = 7 + Math.min(count, 4) * 0.5;
  const y = groundY - height / 2 - 2;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <rect
          key={i}
          x={cx - width / 2}
          y={y}
          width={width}
          height={height}
          rx={height / 2}
          fill={LOG_COLORS[i % LOG_COLORS.length]}
          transform={`rotate(${LOG_ROTATIONS[i % LOG_ROTATIONS.length]} ${cx} ${y + height / 2})`}
        />
      ))}
    </>
  );
}

export default function BonfireVisual({ logs, size = "lg" }: { logs: number; size?: "sm" | "lg" }) {
  const tier = getTierForLogs(logs);
  const { next, progress } = nextTierProgress(logs);
  const dims = size === "lg" ? 220 : 130;

  const cx = 100;
  const groundY = 168;
  const glowR = 58 + tier.flameScale * 42;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative ${tier.glowClass}`} style={{ width: dims, height: dims }}>
        {size === "lg" &&
          Array.from({ length: tier.emberCount }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-12 h-1.5 w-1.5 rounded-full bg-ember-300 animate-ember"
              style={{
                left: `${18 + ((i * 64) % 64)}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2.6 + (i % 3) * 0.4}s`,
                // @ts-expect-error css custom property
                "--drift": `${(i % 2 === 0 ? 1 : -1) * (8 + i * 3)}px`,
              }}
            />
          ))}

        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <radialGradient id="flameCoreMain" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff8ec" />
              <stop offset="30%" stopColor="#ffe3bf" />
              <stop offset="55%" stopColor="#ffb066" />
              <stop offset="80%" stopColor="#ff7f2a" />
              <stop offset="100%" stopColor="#c0330d" />
            </radialGradient>
            <radialGradient id="glowMain" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="#ff5e1a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ff5e1a" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={cx} cy={groundY - 60} r={glowR} fill="url(#glowMain)" className="animate-pulseGlow" />
          {tier.doubleGlow && (
            <circle cx={cx} cy={groundY - 60} r={glowR * 0.68} fill="url(#glowMain)" opacity={0.7} />
          )}

          <ellipse cx={cx} cy={groundY + 6} rx={20 + tier.logCount * 6} ry={6} fill="#161b28" />

          <Logs cx={cx} groundY={groundY} count={tier.logCount} />

          {tier.sideFlames.map((sf: SideFlame, i: number) => (
            <FlameGlyph
              key={i}
              cx={cx + sf.dx}
              groundY={groundY}
              scale={sf.scale}
              rotate={sf.rotate}
              opacity={sf.opacity}
              gradientId="flameCoreMain"
            />
          ))}

          <FlameGlyph cx={cx} groundY={groundY} scale={tier.flameScale} gradientId="flameCoreMain" />
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
            <div className="mt-1 text-xs text-ash-500">
              {next.min - logs} logs to {next.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
