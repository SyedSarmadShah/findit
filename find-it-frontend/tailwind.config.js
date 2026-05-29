/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        paper: '#f4efe6',
        sand: '#e8dcc8',
        moss: '#315b4f',
        rust: '#c45b2a',
      },
      boxShadow: {
        glow: '0 18px 60px rgba(7, 17, 31, 0.16)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
