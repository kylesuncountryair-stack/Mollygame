// A handful of faint, slowly drifting sparks fixed to the viewport, mounted
// once in the root layout so every page feels a little alive instead of
// static. Deliberately subtle (low opacity, small, slow) — this should read
// as "ambiance" on a second glance, not as something competing for
// attention with the actual content.
const COLORS = ["#f58232", "#ffc24a", "#4a9eff"];

const SPARKS = Array.from({ length: 14 }).map((_, i) => ({
  top: (i * 37) % 100,
  left: (i * 53 + 7) % 100,
  color: COLORS[i % COLORS.length],
  size: 2 + (i % 3),
  duration: 6 + (i % 5),
  delay: (i * 0.6) % 6,
}));

export default function AmbientSparks() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 6px ${s.color}`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
