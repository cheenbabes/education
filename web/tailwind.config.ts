import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        parchment: "var(--parchment)",
        night: "var(--night)",
        "accent-primary": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-tertiary": "var(--accent-tertiary)",
      },
      fontFamily: {
        "cormorant-sc": ["'Cormorant SC'", "'IM Fell English SC'", "serif"],
        cormorant: ["'Cormorant'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        frost: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
