/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'board-light': '#f0d9b5',
        'board-dark': '#b58863',
        'primary': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        'secondary': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        'piece': '0 3px 5px rgba(0, 0, 0, 0.4)',
        'selected': '0 0 0 3px rgba(250, 204, 21, 0.6)',
        'move': '0 0 0 3px rgba(59, 130, 246, 0.5)',
      },
      borderRadius: {
        'chess': '0.5rem',
      },
      gridTemplateRows: {
        'chess': 'repeat(8, minmax(0, 1fr))',
      },
      gridTemplateColumns: {
        'chess': 'repeat(8, minmax(0, 1fr))',
      },
      height: {
        'square': '3.5rem',
      },
      width: {
        'square': '3.5rem',
      },
    },
  },
  plugins: [],
}