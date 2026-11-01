import { getApiErrorMessage } from '../lib/apiError';
import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/common/Toast';
import SocialLoginButton, { type SocialProvider } from '../components/common/SocialLoginButton';
import { consumeReportLoginReturn, rememberReportLoginReturn } from '../lib/reportNavigation';
import { emailLoginEnabled } from '../lib/emailLogin';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const oauthError = readOAuthError(searchParams.get('error'));
  // Existing email members keep a collapsed entry until the social-account transition ends.
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const user = {
        id: data.userId,
        email: data.email,
        name: data.name,
        role: data.role || 'ROLE_USER',
        careRegNo: data.careRegNo,
        createdAt: new Date().toISOString(),
      };
      setAuth(user, data.accessToken);
      // 로그인 성공 시 알림 없이 바로 이동
      rememberReportLoginReturn(location.state?.from);
      navigate(consumeReportLoginReturn());
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, '이메일 또는 비밀번호가 일치하지 않습니다.');
      setErrorMessage(message);
      setToast({
        message,
        type: 'error',
        isVisible: true,
      });
    },
  });

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      setEmailError('이메일을 입력해주세요.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    loginMutation.mutate({ email, password });
  };

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

            {emailLoginEnabled && <>
            <div className="my-6 border-t border-gray-200 dark:border-gray-600" />

            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setShowEmailLogin((open) => !open)}
                aria-expanded={showEmailLogin}
                aria-controls="email-login-form"
                className="flex items-center justify-between text-left text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <span>로컬 개발용 계정: 이메일로 로그인</span>
                <span aria-hidden="true" className="material-symbols-outlined text-xl">{showEmailLogin ? 'expand_less' : 'expand_more'}</span>
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                로컬 백엔드에 연결했을 때만 보입니다. 운영에서는 네이버·구글 로그인만 씁니다.
              </p>
            </div>

            {showEmailLogin && (
              <div id="email-login-form" className="mt-5">
                <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    {/* Email Input */}
                    <div className="flex flex-col w-full">
                      <label htmlFor="login-email" className="block text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                        이메일
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          // 입력 중일 때는 에러 메시지만 숨김 (입력값은 유지)
                          if (emailError) {
                            setEmailError('');
                          }
                          if (errorMessage) {
                            setErrorMessage('');
                          }
                        }}
                        className={`form-input w-full rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-focus border ${
                          emailError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-4 text-sm font-normal leading-normal`}
                        placeholder="이메일 주소를 입력하세요"
                        disabled={loginMutation.isPending}
                      />
                      {emailError && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                          <span aria-hidden="true" className="material-symbols-outlined text-base">error</span>
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col w-full">
                      <label htmlFor="login-password" className="block text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                        비밀번호
                      </label>
                      <div className="relative w-full h-12">
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            // 입력 중일 때는 에러 메시지만 숨김 (입력값은 유지)
                            if (passwordError) {
                              setPasswordError('');
                            }
                            if (errorMessage) {
                              setErrorMessage('');
                            }
                          }}
                          className={`form-input w-full h-full rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-focus border ${
                            passwordError || errorMessage ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-4 pr-10 text-sm font-normal leading-normal`}
                          placeholder="비밀번호를 입력하세요"
                          disabled={loginMutation.isPending}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-xl">
                            {showPassword ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      </div>
                      {(passwordError || errorMessage) && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                          <span aria-hidden="true" className="material-symbols-outlined text-base">error</span>
                          {errorMessage || passwordError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-brand text-brand-ink text-base font-bold leading-normal tracking-wide hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus dark:focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {loginMutation.isPending ? '로그인 중...' : '이메일로 로그인'}
                    </span>
                  </button>

                </form>
              </div>
            )}
            </>}
          </div>
        </div>
        </div>
      </div>

      {/* Toast 알림 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={4000}
      />
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
