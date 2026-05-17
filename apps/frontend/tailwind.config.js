/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          500: "#3b5bdb",
          600: "#2f48b3",
          700: "#253a8f",
        },
      },
    },
  },
  plugins: [],
};
