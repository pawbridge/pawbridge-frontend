// Approved Figma: PawBridge Yellow v1 (main v2.3).
const brand = {
  DEFAULT: '#FFF2A6',
  hover: '#F7E58C',
  soft: '#FFFCE9',
  ink: '#30302E',
  muted: '#646460',
  border: '#DDDDD8',
};

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
          brand: {
            ...brand,
            accent: 'rgb(var(--brand-accent) / <alpha-value>)',
            focus: 'rgb(var(--brand-focus) / <alpha-value>)',
          },
          // Compatibility names for existing page contracts; all point to the same brand.
          primary: brand.DEFAULT,
          "background-light": "#ffffff",
          "background-dark": "#0f0f0f",
          "text-light": brand.ink,
          "text-dark": "#e7e5e4",
          "card-light": "#ffffff",
          "card-dark": "#1a1a1a",
          "border-light": "#e5e7eb",
          "border-dark": "#374151",
          'text-main': brand.ink,
          'text-secondary': brand.muted,
          'subtext-light': brand.muted,
          'subtext-dark': '#d6d3d1',
          'surface-light': '#ffffff',
          'surface-dark': '#1a1a1a',
          // 기존 색상 호환성 유지
          "primary-content": brand.ink,
          "secondary-content": brand.muted
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