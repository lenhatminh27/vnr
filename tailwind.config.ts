import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#132238",
        mist: "#eef4fb",
        panel: "#f7fbff",
        accent: "#ff7a18",
        accentSoft: "#ffe3cf"
      },
      boxShadow: {
        panel: "0 24px 64px rgba(19, 34, 56, 0.08)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(19,34,56,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(19,34,56,0.06) 1px, transparent 1px)"
      },
      fontFamily: {
        sans: ["var(--font-patrick-hand)", "cursive"]
      }
    }
  },
  plugins: []
};

export default config;
