/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rose-light': '#f5e6e8',
        'rose-mid': '#e8c5ca',
        'rose-deep': '#c9858f',
        'rose-text': '#8b4a52',
        'warm-white': '#fefcf8',
        'beige-soft': '#f0ebe0',
        'text-dark': '#3a2e2e',
        'text-mid': '#7a6a6a',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}