/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080b12',
        panel: '#0f1420',
        line: '#202839',
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
        violet: { 400: '#a78bfa', 500: '#8b5cf6' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: { glow: '0 0 40px rgba(34,211,238,.09)' },
    },
  },
  plugins: [],
}
