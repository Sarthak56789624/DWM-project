/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: '#ff0033', // YouTube Red
          glow: '#ff0055',
          foreground: '#ffffff',
        },
        accent: {
          cyan: '#00f2fe',
          magenta: '#ff0844',
          amber: '#f6d365',
          purple: '#9d50bb',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(255, 0, 85, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(0, 242, 254, 0.3)',
        'glow-purple': '0 0 25px -5px rgba(157, 80, 187, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
