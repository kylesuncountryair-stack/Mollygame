import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b0f1a",
          panel: "#121828",
          card: "#171f33",
        },
        ember: {
          50: "#fff4e6",
          100: "#ffe3bf",
          200: "#ffc078",
          300: "#ff9f43",
          400: "#ff7f2a",
          500: "#ff5e1a",
          600: "#e8450f",
          700: "#c0330d",
          800: "#8f2408",
          900: "#5c1605",
        },
        ash: {
          100: "#e7e9ee",
          300: "#aab0c2",
          500: "#6f7690",
          700: "#3b4160",
          900: "#1c2136",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 126, 42, 0.45)",
        "glow-lg": "0 0 90px rgba(255, 110, 20, 0.55)",
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
