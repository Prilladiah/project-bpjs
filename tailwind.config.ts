import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#0F1B33", muted: "#5B6B85", leaf: "#5FA65A", sea: "#2E6DB4", paper: "#F5F9FE", edge: "#E3EBF6" },
    fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    boxShadow: { card: "0 10px 30px -12px rgba(30,64,120,.18)" },
  } },
  plugins: [],
} satisfies Config;
