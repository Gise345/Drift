/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED', // Mid-dark vibrant purple
        secondary: '#A78BFA', // Lighter purple accent
        'purple-dark': '#6D28D9', // Darker purple
        'purple-light': '#C4B5FD', // Light purple
      }
    },
  },
  plugins: [],
}