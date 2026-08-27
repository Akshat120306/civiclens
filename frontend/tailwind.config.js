/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedc',
          400: '#5f9ec8',
          500: '#3b82b3',
          600: '#2b6897',
          700: '#23547b',
          800: '#1e4766',
          900: '#0f3a6a', // Deep Government Blue
          950: '#0b2545',
        },
        badge: {
          open: '#3b82f6',
          inprogress: '#f59e0b',
          resolved: '#10b981',
          verified: '#059669',
          disputed: '#ef4444',
          recurring: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
