import { getApiErrorMessage } from '../lib/apiError';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

// 운영 시험 계정(이메일 계정) 전용 로그인. 어떤 화면도 이 주소로 연결하지 않으며 회원은 네이버·구글로만 로그인한다.
export default function TestLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      navigate('/');
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, '이메일 또는 비밀번호가 일치하지 않습니다.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const nextEmailError = !email.trim() ? '이메일을 입력해주세요.' : '';
    const nextPasswordError = !password.trim() ? '비밀번호를 입력해주세요.' : '';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md flex flex-col gap-6">
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

        <div className="w-full rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">시험 계정 로그인</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              운영 점검용 이메일 계정만 쓸 수 있어요. 회원은{' '}
              <Link to="/login" className="underline">네이버·구글 로그인</Link>을 이용해주세요.
            </p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col w-full">
                <label htmlFor="test-login-email" className="block text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                  이메일
                </label>
                <input
                  id="test-login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                    if (errorMessage) setErrorMessage('');
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

              <div className="flex flex-col w-full">
                <label htmlFor="test-login-password" className="block text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                  비밀번호
                </label>
                <div className="relative w-full h-12">
                  <input
                    id="test-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (errorMessage) setErrorMessage('');
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
                  <p role="alert" className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                    <span aria-hidden="true" className="material-symbols-outlined text-base">error</span>
                    {errorMessage || passwordError}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-brand text-brand-ink text-base font-bold leading-normal tracking-wide hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus dark:focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate">{loginMutation.isPending ? '로그인 중...' : '로그인'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
