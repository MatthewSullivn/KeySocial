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
        bg: {
          primary: "#0B0A1A",
          card: "#13112A",
          elevated: "#1C1838",
          input: "#1C1838",
          hover: "#231F42",
        },
        purple: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        pink: {
          400: "#F472B6",
          500: "#EC4899",
          600: "#DB2777",
        },
        accent: {
          green: "#10B981",
          red: "#EF4444",
          yellow: "#F59E0B",
          blue: "#3B82F6",
          teal: "#14B8A6",
          pink: "#EC4899",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "Space Grotesk", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["Courier New", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        shake: "shake 0.5s ease-in-out",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        "key-pop": "key-pop 0.15s ease-out",
        "race-progress": "race-progress 0.3s ease-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(139,92,246,0.3), 0 0 10px rgba(139,92,246,0.2)" },
          "100%": { boxShadow: "0 0 10px rgba(139,92,246,0.4), 0 0 20px rgba(139,92,246,0.3), 0 0 30px rgba(139,92,246,0.2)" },
        },
        "race-progress": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "key-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(139, 92, 246, 0.15)",
        "glow-md": "0 0 20px rgba(139, 92, 246, 0.2)",
        "glow-lg": "0 0 30px rgba(139, 92, 246, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-purple": "linear-gradient(135deg, #7C3AED, #8B5CF6, #6D28D9)",
      },
    },
  },
  plugins: [],
};

export default config;
