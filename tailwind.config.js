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
          "primary": "#34d399",
          "background-light": "#f0fdfa",
          "background-dark": "#0d1a16",
          "text-light": "#052e16",
          "text-dark": "#d1fae5",
          "card-light": "#ffffff",
          "card-dark": "#052e16",
          "border-light": "#99f6e4",
          "border-dark": "#14532d",
          // 기존 색상 호환성 유지
          "primary-content": "#0d1b14",
          "secondary-content": "#4c9a73"
        },
        fontFamily: {
          "display": ["Inter", "Noto Sans KR", "sans-serif"]
        },
        borderRadius: {
          "DEFAULT": "0.5rem",
          "lg": "0.75rem",
          "xl": "1rem",
          "full": "9999px"
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  }