// Approved Figma: SHYU Semantic PawBridge Blue v1 (F안, 2026-11-12).
const brand = {
  DEFAULT: '#006CF3',
  hover: '#0060DA',
  // 파랑 바탕 위 글자(action/primary-text). 흰 글자 대비 4.73:1
  contrast: '#FFFFFF',
  soft: '#F2F7FF',
  ink: '#30302E',
  muted: '#646460',
  border: '#DDDDD8',
};

// SHYU 다크(D안)에 맞춘 무채색 회색. 차가운 회색(gray) 대신 따뜻한 무채색을 쓴다.
// 50~600은 stone과 같고, 700~900은 다크 화면 값(테두리 #333333, 카드 #1A1A1A, 바탕 #0F0F0F)이다.
const neutralGray = {
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#57534E',
  700: '#333333',
  800: '#1A1A1A',
  900: '#0F0F0F',
  950: '#0A0A0A',
};
// 관리자 화면은 stone을 쓰고 패널이 #1A1A1A라서, 800을 한 단계 밝은 #262626(눌림, 선택 배경)으로 둔다.
const neutralStone = { ...neutralGray, 800: '#262626', 900: '#1A1A1A' };

// SHYU typography: ordinary text and legacy display classes share one family.
const fontSans = ["Noto Sans KR", "sans-serif"];

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
          gray: neutralGray,
          stone: neutralStone,
          brand: {
            ...brand,
            // 테두리, 보조 글자, 연한 바탕, 선택 바탕은 다크에서 다크 값으로 바뀐다(index.css의 .dark).
            soft: 'rgb(var(--brand-soft) / <alpha-value>)',
            // 선택된 탭, 칩, 메뉴의 바탕과 그 위 글자(bg/accent). 주 버튼(bg-brand)과 구분한다.
            selected: 'rgb(var(--brand-selected) / <alpha-value>)',
            'selected-hover': 'rgb(var(--brand-selected-hover) / <alpha-value>)',
            'selected-ink': 'rgb(var(--brand-selected-ink) / <alpha-value>)',
            muted: 'rgb(var(--brand-muted) / <alpha-value>)',
            border: 'rgb(var(--brand-border) / <alpha-value>)',
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
          "border-dark": "#333333",
          // 다크에서 연한 바탕 자리를 구분하는 35% 파랑 테두리(blue-dark-line #5196FD)
          "accent-border-dark": "rgb(81 150 253 / 0.35)",
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
          "sans": fontSans,
          "display": fontSans,
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
