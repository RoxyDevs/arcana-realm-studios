import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arcana: {
          bg: "#05050a",
          surface: "#0d0d18",
          border: "#241f38",
          borderMuted: "#1a1728",
          cyan: "#00fff2",
          pink: "#ff2bd6",
          purple: "#b026ff",
          text: "#e8e8f5",
          textMuted: "#8f89ab",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan":
          "0 0 4px rgba(0,255,242,0.8), 0 0 16px rgba(0,255,242,0.45), 0 0 40px rgba(0,255,242,0.2)",
        "neon-pink":
          "0 0 4px rgba(255,43,214,0.8), 0 0 16px rgba(255,43,214,0.45), 0 0 40px rgba(255,43,214,0.2)",
        "neon-cyan-sm": "0 0 12px rgba(0,255,242,0.35)",
        "neon-pink-sm": "0 0 12px rgba(255,43,214,0.35)",
      },
      textShadow: {
        "neon-cyan": "0 0 8px rgba(0,255,242,0.9), 0 0 24px rgba(0,255,242,0.5)",
        "neon-pink": "0 0 8px rgba(255,43,214,0.9), 0 0 24px rgba(255,43,214,0.5)",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, theme }) => {
      const shadows = theme("textShadow") as Record<string, string>;
      addUtilities(
        Object.fromEntries(
          Object.entries(shadows).map(([key, value]) => [`.text-shadow-${key}`, { textShadow: value }]),
        ),
      );
    }),
  ],
} satisfies Config;
