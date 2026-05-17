import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CSS variables — sobrescritos por tema de tenant (white label)
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        highlight: "var(--color-highlight)",
        // Paleta Vegl.ia base
        twilight: "#1A3A5C",
        "deep-navy": "#0B2545",
        "mid-blue": "#2E5078",
        mint: "#5DD3A8",
        "mint-deep": "#2DA67D",
        champagne: "#C9A96E",
        cream: "#F4EDE0",
        "warm-white": "#FBF8F1",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
