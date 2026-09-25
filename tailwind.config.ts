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
        background: "#0f172a",
        foreground: "#f8fafc",
        card: "rgba(30, 41, 59, 0.7)",
        cardBorder: "rgba(255, 255, 255, 0.1)",
        accent: {
          cyan: "#06b6d4",
          cyanDark: "#0891b2",
          blue: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          purple: "#8b5cf6",
          pink: "#ec4899"
        }
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "sonar": "sonar 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "scan": "scan 3s ease-in-out infinite alternate",
        "wiggle": "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        sonar: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
