import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: "#FAF9F6",
        hairline: "#E8E4DD",
        ink: "#191C1B",
        "ink-muted": "#6E6A63",
        "ink-faint": "#9C978E",
        accent: "#0E5B54",
        "accent-hover": "#0A4640",
        "accent-soft": "#EDF3F1",
      },
      boxShadow: {
        card: "0 1px 2px rgba(25,28,27,0.04), 0 12px 28px -16px rgba(25,28,27,0.18)",
        bubble: "0 1px 2px rgba(25,28,27,0.05)",
      },
      keyframes: {
        "card-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "msg-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        "card-in": "card-in 340ms cubic-bezier(0.16, 1, 0.3, 1)",
        "msg-in": "msg-in 220ms ease-out",
        blink: "blink 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
