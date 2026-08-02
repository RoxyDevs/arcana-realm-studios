import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arcana: {
          bg: "#0a0a0f",
          surface: "#131318",
          border: "#232330",
          accent: "#7c5cff",
          accentMuted: "#4c3d99",
          text: "#e4e4ec",
          textMuted: "#8b8b9a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
