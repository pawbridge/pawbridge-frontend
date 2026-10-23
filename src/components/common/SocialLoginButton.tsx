// Matches Figma "PawBridge/Social Login Button v1" (page 83 · 로그인 v2.0).
// Naver: brand green #03C75A with the white N mark. Google: white surface with the official four-colour G.

export type SocialProvider = 'naver' | 'google';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onClick: () => void;
  disabled?: boolean;
}

const LABELS: Record<SocialProvider, string> = {
  naver: '네이버로 시작하기',
  google: '구글로 시작하기',
};

function NaverMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M13.56 10.7 6.17 0H0v20h6.44V9.3L13.83 20H20V0h-6.44z" fill="#FFFFFF" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function SocialLoginButton({ provider, onClick, disabled = false }: SocialLoginButtonProps) {
  const surface = provider === 'naver'
    ? 'bg-[#03C75A] text-white hover:bg-[#02b350] border border-transparent'
    : 'bg-white text-brand-ink hover:bg-gray-50 border border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[52px] w-full items-center justify-center gap-2.5 rounded-lg px-4 text-[15px] font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-focus focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${surface}`}
    >
      {provider === 'naver' ? <NaverMark /> : <GoogleMark />}
      <span>{LABELS[provider]}</span>
    </button>
  );
}
