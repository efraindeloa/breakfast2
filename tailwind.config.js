/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./screens/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#f48c25",
        "secondary": "#fbbf24",
        "success": "#4ade80",
        "background-light": "#f8f7f5",
        "background-dark": "#221910",
        "paper-yellow": "#FDF9E7",
        "paper-line": "#E2E8F0",
        "ink-blue": "#2C3E50",
        "morning-accent": "#FF9F43",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "script": ["Dancing Script", "cursive"],
        "handwriting": ["Gochi Hand", "cursive"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
