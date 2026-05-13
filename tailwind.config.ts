import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', '"IBM Plex Sans JP"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"Geist Mono"', '"IBM Plex Sans JP"', '"SF Mono"', "Menlo", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#FAFAFA", 2: "#F4F4F4" },
        surface: { DEFAULT: "#FFFFFF", 2: "#F8F8F8" },
        border: { DEFAULT: "#E8E8E8", 2: "#EFEFEF" },
        ink: { DEFAULT: "#0A0A0A", 2: "#404040", 3: "#737373", 4: "#A3A3A3", 5: "#D4D4D4" },
        accent: { DEFAULT: "#00C853", soft: "#DCFCE7", deep: "#047857" },
        crit: { DEFAULT: "#EF4444", soft: "#FEE2E2" },
        warn: { DEFAULT: "#F97316", soft: "#FFEDD5" },
        info: { DEFAULT: "#3B82F6", soft: "#DBEAFE" },
      },
      borderRadius: { sm: "6px", DEFAULT: "10px", lg: "14px" },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,.04)",
        sm: "0 1px 3px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.03)",
        md: "0 4px 12px rgba(0,0,0,.08)",
        lg: "0 12px 28px rgba(0,0,0,.16), 0 4px 10px rgba(0,0,0,.08)",
        xl: "0 24px 48px -8px rgba(0,0,0,.20), 0 8px 16px rgba(0,0,0,.06)",
      },
      letterSpacing: { tightish: "-0.005em" },
    },
  },
  plugins: [],
} satisfies Config;
