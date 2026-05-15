import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Inter"',
          '"Noto Sans JP"',
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Inter"',
          '"Noto Sans JP"',
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          DEFAULT: "#1A1A1F",
          2: "#4A4A52",
          3: "#757580",
          4: "#A0A0AE",
        },
        primary: {
          DEFAULT: "#7B5BFF",
          deep: "#5A3FD9",
        },
        tint: {
          mint:     "#C9F0DA",
          peach:    "#FFD8C2",
          sky:      "#C9DEFC",
          lavender: "#DAD2F5",
          rose:     "#FCD2E0",
          yellow:   "#FCEEB7",
          coral:    "#FFCFD0",
          teal:     "#BFE6E0",
        },
        tintFg: {
          mint:     "#1F5A3A",
          peach:    "#6F3014",
          sky:      "#1A3D80",
          lavender: "#3A2370",
          rose:     "#7A1E47",
          yellow:   "#6F5210",
          coral:    "#7A1E1E",
          teal:     "#0E4F4A",
        },
        crit: { DEFAULT: "#B83232", soft: "rgba(184,50,50,.12)" },
        warn: { DEFAULT: "#D9802A", soft: "rgba(217,128,42,.14)" },
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "16px",
        xl: "22px",
        pill: "9999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(70,40,140,.06)",
        "glass-lg": "0 24px 64px rgba(70,40,140,.18), 0 4px 12px rgba(70,40,140,.06)",
        primary: "0 4px 14px rgba(123,91,255,.35)",
        soft: "0 2px 8px rgba(70,40,140,.08)",
      },
      letterSpacing: {
        tightish: "-0.012em",
        display: "-0.022em",
      },
      backdropBlur: {
        glass: "40px",
        "glass-sm": "20px",
      },
      backdropSaturate: {
        glass: "180%",
      },
    },
  },
  plugins: [],
} satisfies Config;
