// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    "#0A2540",
          DEFAULT: "#2563EB",
          light:   "#EFF6FF",
        },
      },
      spacing: {
        sidebar: "14rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "xl":  "0.75rem",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};