import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sun Country's actual brand palette: cadmium orange (#F58232) and
        // midnight navy (#004885), used as the two real accent colors
        // instead of a generic single warm gradient. Gold is a third,
        // narrower accent reserved for rank/tier moments.
        bg: {
          DEFAULT: "#081226",
          panel: "#0a1830",
          card: "#0d1c38",
        },
        ember: {
          50: "#fff3e8",
          100: "#ffe0c2",
          200: "#ffc48a",
          300: "#ffab5c",
          400: "#fb9450",
          500: "#f58232",
          600: "#e06a1c",
          700: "#b8530f",
          800: "#8a3d0a",
          900: "#5c2806",
        },
        navy: {
          50: "#e9f0f9",
          100: "#c7d6ee",
          200: "#9fb8d9",
          300: "#4a9eff",
          400: "#2f5490",
          500: "#22406e",
          600: "#1c3157",
          700: "#16274a",
          800: "#0d1c38",
          900: "#00284d",
        },
        gold: {
          200: "#ffe3ac",
          300: "#ffd27a",
          400: "#ffc24a",
          500: "#f0ab1e",
          600: "#c98a0c",
        },
        ash: {
          100: "#f5f7fb",
          200: "#c7d6ee",
          300: "#9fb8d9",
          400: "#93a4c2",
          500: "#7d93b8",
          600: "#5f7396",
          700: "#1c3157",
          800: "#192c50",
          900: "#16274a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(245, 130, 50, 0.4)",
        "glow-lg": "0 0 90px rgba(245, 130, 50, 0.5)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { transform: "scale(1) translateY(0) rotate(-1deg)" },
          "25%": { transform: "scale(1.03) translateY(-2px) rotate(1deg)" },
          "50%": { transform: "scale(0.98) translateY(1px) rotate(-2deg)" },
          "75%": { transform: "scale(1.02) translateY(-1px) rotate(2deg)" },
        },
        ember: {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0.9" },
          "100%": { transform: "translateY(-120px) translateX(var(--drift, 10px))", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        flicker: "flicker 2.4s ease-in-out infinite",
        ember: "ember 3s ease-in infinite",
        pulseGlow: "pulseGlow 2.5s ease-in-out infinite",
        rise: "rise 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
