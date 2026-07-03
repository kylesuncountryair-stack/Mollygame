"use client";

const COLORS = ["#f58232", "#ffc24a", "#4a9eff", "#4ade80"];

const PARTICLES = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const distance = 34 + (i % 3) * 14;
  return {
    color: COLORS[i % COLORS.length],
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance - 12,
    tr: (i % 2 === 0 ? 1 : -1) * (140 + i * 18),
    delay: (i % 6) * 0.03,
    square: i % 2 === 0,
  };
});

// A short-lived burst of particles from the center of its container. Meant
// to be dropped into a `relative` (or `fixed`) positioned parent right when
// something worth celebrating just happened — it doesn't loop or persist.
export default function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 animate-confetti-burst ${p.square ? "rounded-sm" : "rounded-full"}`}
          style={{
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            // @ts-expect-error css custom properties
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            "--tr": `${p.tr}deg`,
          }}
        />
      ))}
    </div>
  );
}
