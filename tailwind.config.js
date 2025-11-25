/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "primary": "#2bee8d",
          "background-light": "#f8fcfa",
          "background-dark": "#102219",
          "primary-content": "#0d1b14",
          "secondary-content": "#4c9a73"
        },
        fontFamily: {
          "display": ["Plus Jakarta Sans", "Noto Sans KR", "sans-serif"]
        },
        borderRadius: {
          "DEFAULT": "0.5rem",
          "lg": "0.75rem",
          "xl": "1rem",
          "full": "9999px"
        },
      },
    },
    plugins: [],
  }