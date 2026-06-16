import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "la-bg": "#ffffff",
        "la-bg-soft": "#f5f5f7",
        "la-text": "#1d1d1f",
        "la-muted": "#6e6e73",
        "la-line": "#e5e5ea",
        "la-accent": "#5e5ce6",
        "la-accent-strong": "#4846c9",
        "la-teal": "#21a89a",
        "la-surface": "#ffffff"
      },
      boxShadow: {
        "la-card": "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
        "la-primary": "0 12px 24px rgba(94,92,230,0.24)",
        "la-soft": "0 10px 30px rgba(29,29,31,0.08)"
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"SF Pro Display"',
          '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
