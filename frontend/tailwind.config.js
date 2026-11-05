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
          dark: '#272b30',       // Top bar charcoal
          navy: '#0b3c68',       // Stanford/PES Chemicals deep navy logo
          cyan: '#13b5ea',       // Primary vibrant cyan navbar
          cyanHover: '#0da1d2',
          cyanLight: '#e0f7fe',  // Light cyan tint for badges/tabs
          quoteBtn: '#13b5ea',
          msdsBtn: '#00a8cc',
        },
        hazard: {
          flam: '#ef4444',
          toxic: '#8b5cf6',
          corr: '#f97316',
          oxid: '#eab308',
          bio: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
