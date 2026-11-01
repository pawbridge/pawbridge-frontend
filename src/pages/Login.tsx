import { useLocation, useSearchParams, Link } from 'react-router-dom';
import SocialLoginButton, { type SocialProvider } from '../components/common/SocialLoginButton';
import { rememberReportLoginReturn } from '../lib/reportNavigation';

export default function Login() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const oauthError = readOAuthError(searchParams.get('error'));

  const handleSocialLogin = (provider: SocialProvider) => {
    rememberReportLoginReturn(location.state?.from);
    // 백엔드 OAuth2 엔드포인트로 리다이렉트
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    window.location.href = `${backendUrl}/oauth2/authorization/${provider}`;
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* 로고 - 카드 바로 위 */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-4 text-brand-ink dark:text-white hover:opacity-80 transition-opacity">
            <div className="text-brand-accent text-2xl">
              <span aria-hidden="true" className="material-symbols-outlined">pets</span>
            </div>
            <h2 className="text-brand-ink dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              포우 브릿지
            </h2>
          </Link>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="flex h-full w-full overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Left Side - Image & Welcome Message */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-brand-soft dark:bg-gray-800 p-12">
          <div className="flex flex-col items-center text-center gap-6">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvVy0FVCRXUdSS1RMfqcRZOpupHqPdWMGTlsGKB-sEfuo-bTI7QI5lllkGy__chxfvNt4DFcyA3Ixmoi8rWp_JsFfSLOVPTfBXvC53-AbyRIjyOt98RkWW9mvY1ZCbhgeR9McROS520VWyxIi0CZgZpk5ooy15zMqvvJRg64a43gZA-b6udBnKWRgbAEds9Qm5YgGypudMo32-IhafKYW7PCsC-Az_LrdiYhjengwROMo9LB7xnbONL9P38Jz2eUiAQMoIPrkkxb0"
              alt="작은 강아지를 조심스럽게 안고 있는 사람"
              className="w-40 h-40 rounded-full object-cover mb-4"
            />
            <p className="text-3xl font-bold leading-tight tracking-tight text-brand-ink dark:text-brand-accent">
              세상의 모든 동물이<br />행복해지는 그날까지
            </p>
            <p className="text-base font-normal leading-relaxed text-gray-600 dark:text-gray-400">
              유기동물을 위한 따뜻한 커뮤니티에<br />오신 것을 환영합니다.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6 flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">로그인</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">네이버 또는 구글 계정으로 바로 시작할 수 있어요.</p>
            </div>

            {oauthError && (
              <p role="alert" className="mb-4 flex items-start gap-1 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <span aria-hidden="true" className="material-symbols-outlined text-base">error</span>
                {oauthError}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <SocialLoginButton provider="naver" onClick={() => handleSocialLogin('naver')} />
              <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} />
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                처음 로그인하면 포우 브릿지 계정이 자동으로 만들어지며{' '}
                <Link to="/terms" className="underline">이용약관</Link>에 동의한 것으로 봅니다. 개인정보는{' '}
                <Link to="/privacy" className="underline">개인정보처리방침</Link>에 따라 처리합니다. 만 14세 미만은 가입할 수 없습니다.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// The backend failure redirect sends one fixed, already-safe Korean sentence; never render arbitrary markup.
function readOAuthError(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
