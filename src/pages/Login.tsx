import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/common/Toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setAuth(user, data.accessToken, data.refreshToken);
      // 로그인 성공 시 알림 없이 바로 이동
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '이메일 또는 비밀번호가 일치하지 않습니다.';
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

  const handleGoogleLogin = () => {
    // 백엔드 OAuth2 엔드포인트로 리다이렉트
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* 로고 - 카드 바로 위 */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-4 text-primary-content dark:text-white hover:opacity-80 transition-opacity">
            <div className="text-primary text-2xl">
              <span className="material-symbols-outlined">pets</span>
            </div>
            <h2 className="text-primary-content dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              포우 브릿지
            </h2>
          </Link>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="flex h-full w-full overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Left Side - Image & Welcome Message */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-emerald-200/50 dark:bg-gray-800 p-12">
          <div className="flex flex-col items-center text-center gap-6">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvVy0FVCRXUdSS1RMfqcRZOpupHqPdWMGTlsGKB-sEfuo-bTI7QI5lllkGy__chxfvNt4DFcyA3Ixmoi8rWp_JsFfSLOVPTfBXvC53-AbyRIjyOt98RkWW9mvY1ZCbhgeR9McROS520VWyxIi0CZgZpk5ooy15zMqvvJRg64a43gZA-b6udBnKWRgbAEds9Qm5YgGypudMo32-IhafKYW7PCsC-Az_LrdiYhjengwROMo9LB7xnbONL9P38Jz2eUiAQMoIPrkkxb0"
              alt="A person gently holding a small dog, symbolizing care and adoption"
              className="w-40 h-40 rounded-full object-cover mb-4"
            />
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-emerald-600 dark:text-primary">
              세상의 모든 동물이<br />행복해지는 그날까지
            </h1>
            <p className="text-base font-normal leading-relaxed text-gray-600 dark:text-gray-400">
              유기동물을 위한 따뜻한 커뮤니티에<br />오신 것을 환영합니다.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="pb-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">로그인</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* Email Input */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                    이메일
                  </p>
                  <input
                    type="text"
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
                    className={`form-input w-full rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary border ${
                      emailError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 h-12 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-4 text-sm font-normal leading-normal`}
                    placeholder="이메일 주소를 입력하세요"
                    disabled={loginMutation.isPending}
                  />
                  {emailError && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">error</span>
                      {emailError}
                    </p>
                  )}
                </label>

                {/* Password Input */}
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-normal pb-2">
                    비밀번호
                  </p>
                  <div className="relative w-full h-12">
                    <input
                      type={showPassword ? 'text' : 'password'}
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
                      className={`form-input w-full h-full rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary border ${
                        passwordError || errorMessage ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-500 px-4 pr-10 text-sm font-normal leading-normal`}
                      placeholder="비밀번호를 입력하세요"
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                      aria-label="비밀번호 보기"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  {(passwordError || errorMessage) && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">error</span>
                      {errorMessage || passwordError}
                    </p>
                  )}
                </label>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-sm font-medium text-primary-dark hover:text-primary dark:text-primary dark:hover:text-primary-light"
                >
                  비밀번호 찾기
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-wide hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">
                  {loginMutation.isPending ? '로그인 중...' : '로그인'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-gray-900 px-2 text-sm text-gray-500 dark:text-gray-400">
                    또는
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <img
                  src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
                  alt="Google logo"
                  className="h-5 w-5"
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  구글로 로그인
                </span>
              </button>

              {/* Signup Link */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                아직 회원이 아니신가요?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-primary-dark hover:text-primary dark:text-primary dark:hover:text-primary-light"
                >
                  회원가입
                </Link>
              </p>
            </form>
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