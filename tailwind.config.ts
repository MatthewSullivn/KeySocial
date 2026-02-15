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
        // UI theme (v2 templates)
        primary: "#D9ED65", // lime (landing)
        "primary-hover": "#C8DB5B",
        secondary: "#EA4C89", // race accent
        tertiary: "#6366F1", // purple accent
        "accent-lime": "#D9ED5F",
        "accent-pink": "#F45D86",
        "accent-purple": "#6B63F6",
        "accent-blue": "#5D5DF8",
        "accent-teal": "#4FD1C5",
        accent: "#D6EF5B", // feed lime token
        "accent-dark": "#b0c92b",
        "background-light": "#F7F9FB",
        "background-dark": "#0F172A",
        "card-light": "#FFFFFF",
        "card-dark": "#1F2937",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E293B",
        "text-light": "#111827",
        "text-dark": "#F3F4F6",
        "muted-light": "#6B7280",
        "muted-dark": "#9CA3AF",
        "border-color": "#E5E7EB",

        // Keep legacy palette (used in a few components)
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        neon: {
          green: "#39FF14",
          blue: "#00f0ff",
          purple: "#b829ff",
          pink: "#ff2d78",
          yellow: "#ffe600",
        },
        dark: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#252530",
          500: "#32323f",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["Courier New", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "shake": "shake 0.5s ease-in-out",
        "glow": "glow 2s ease-in-out infinite alternate",
        "race-progress": "race-progress 0.3s ease-out",
        "key-pop": "key-pop 0.15s ease-out",
        "stumble": "stumble 0.4s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        "glow": {
          "0%": { boxShadow: "0 0 5px currentColor, 0 0 10px currentColor" },
          "100%": { boxShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor" },
        },
        "race-progress": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "key-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "stumble": {
          "0%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px) rotate(-5deg)" },
          "50%": { transform: "translateX(4px) rotate(3deg)" },
          "75%": { transform: "translateX(-2px) rotate(-1deg)" },
          "100%": { transform: "translateX(0) rotate(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        pop: "4px 4px 0px 0px rgba(0,0,0,1)",
        "pop-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        "pop-hover": "6px 6px 0px 0px rgba(0,0,0,1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
