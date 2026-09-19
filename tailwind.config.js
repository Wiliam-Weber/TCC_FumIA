/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#0B130E',
          card: '#122017',
          primary: '#10B981',
          hover: '#059669',
          accent: '#A3E635',
          muted: '#84968B',
        }
      }
    },
  },
  plugins: [],
}