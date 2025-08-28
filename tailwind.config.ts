import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Playful pastel palette
        candy: {
          pink: "#ffd6e7", // rose-100ish
          peach: "#ffe4cc", // orange-100ish
          mint: "#ccf3e2", // teal-100ish
          sky: "#d9ecff", // sky-100ish
          lilac: "#e9ddff", // violet-100ish
          lemon: "#fff7c2", // yellow-100ish
        },
      },
      boxShadow: {
        soft: "0 10px 24px rgba(0,0,0,.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
