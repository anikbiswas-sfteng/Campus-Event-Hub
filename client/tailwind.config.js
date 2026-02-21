/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.jsx',
    './main.jsx',
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaff',
          100: '#d9f4ff',
          200: '#b4e9ff',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985'
        }
      }
    }
  },
  plugins: []
};
