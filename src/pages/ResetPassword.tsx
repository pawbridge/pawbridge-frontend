import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { sendResetCode, resetPassword } from '../api/auth.api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 1단계: 인증 코드 발송
  const sendCodeMutation = useMutation({
    mutationFn: sendResetCode,
    onSuccess: () => {
      alert('인증 코드가 이메일로 발송되었습니다.');
      setStep(2);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '인증 코드 발송에 실패했습니다';
      alert(message);
    },
  });

  // 2단계: 비밀번호 재설정
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      alert('비밀번호가 재설정되었습니다. 새로운 비밀번호로 로그인해주세요.');
      navigate('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '비밀번호 재설정에 실패했습니다';
      alert(message);
    },
  });

  // 이메일 검증
  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors({ email: '이메일을 입력하세요' });
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors({ email: '유효한 이메일 주소를 입력하세요' });
      return false;
    }
    setErrors({});
    return true;
  };

  // 비밀번호 규칙 검증
  const validatePassword = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 인증 코드 검증
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      newErrors.code = '6자리 인증 코드를 입력하세요';
    }

    // 비밀번호 검증
    if (!newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력하세요';
    } else if (newPassword.length < 8 || newPassword.length > 20) {
      newErrors.newPassword = '비밀번호는 8~20자여야 합니다';
    } else {
      // 영문, 숫자, 특수문자 모두 포함 확인
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /\d/.test(newPassword);
      const hasSpecial = /[@$!%*#?&]/.test(newPassword);
      
      if (!hasLetter || !hasNumber || !hasSpecial) {
        newErrors.newPassword = '영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다';
      }
    }

    // 비밀번호 확인 검증
    if (!confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력하세요';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 1단계 제출
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail()) {
      sendCodeMutation.mutate({ email });
    }
  };

  // 2단계 제출
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword()) {
      resetPasswordMutation.mutate({
        email,
        code: code.join(''),
        newPassword,
      });
    }
  };

  // 인증 코드 재발송
  const handleResendCode = () => {
    sendCodeMutation.mutate({ email });
  };

  // 인증 코드 입력 처리
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // 자동 포커스 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // 백스페이스 처리
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-8 shadow-sm">
        {step === 1 ? (
          // 1단계: 이메일 입력
          <div className="flex flex-col items-center">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight text-center pb-3 pt-6">
              비밀번호 찾기
            </h1>
            <p className="text-gray-900 dark:text-white text-base font-normal leading-normal text-center pb-8">
              가입하신 이메일 주소를 입력하시면 인증 코드를 보내드립니다.
            </p>
            
            <form onSubmit={handleStep1Submit} className="w-full">
              <div className="flex flex-col gap-4 py-3">
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                    이메일
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 bg-background-light dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white h-14 p-[15px] text-base font-normal leading-normal placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="이메일 주소를 입력하세요"
                    disabled={sendCodeMutation.isPending}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.email}</p>
                  )}
                </label>
              </div>

              <div className="flex py-3">
                <button
                  type="submit"
                  disabled={sendCodeMutation.isPending}
                  className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">
                    {sendCodeMutation.isPending ? '발송 중...' : '인증 코드 발송'}
                  </span>
                </button>
              </div>
            </form>

            <Link
              to="/login"
              className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal pt-6 pb-3 text-center underline hover:text-primary dark:hover:text-primary transition-colors"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          // 2단계: 인증 코드 & 비밀번호
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
                비밀번호 재설정
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
                {email}으로 인증 코드가 발송되었습니다.
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-6">
              {/* 인증 코드 */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 dark:text-white text-base font-medium leading-normal">
                  인증 코드
                </label>
                <div className="flex justify-between gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="number"
                      min="0"
                      max="9"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="flex h-14 w-full text-center text-lg font-bold text-gray-900 dark:text-white bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      disabled={resetPasswordMutation.isPending}
                    />
                  ))}
                </div>
                {errors.code && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.code}</p>
                )}
              </div>

              {/* 새 비밀번호 */}
              <div className="flex flex-col gap-1">
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                    새 비밀번호
                  </p>
                  <div className="flex w-full items-stretch rounded-lg">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-primary border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-gray-800 h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                      placeholder="새 비밀번호를 입력하세요"
                      disabled={resetPasswordMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-gray-400 flex border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {showNewPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </label>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal pt-1 px-1">
                  8~20자 영문, 숫자, 특수문자를 조합하여 입력해주세요.
                </p>
                {errors.newPassword && (
                  <p className="text-sm text-red-600 dark:text-red-500">{errors.newPassword}</p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="flex flex-col gap-2">
                <label className="flex flex-col w-full">
                  <p className="text-gray-900 dark:text-white text-base font-medium leading-normal pb-2">
                    비밀번호 확인
                  </p>
                  <div className="flex w-full items-stretch rounded-lg">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-primary border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-gray-800 h-14 placeholder:text-gray-400 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                      placeholder="비밀번호를 다시 한번 입력하세요"
                      disabled={resetPasswordMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 flex border border-gray-300 dark:border-gray-600 bg-background-light dark:bg-gray-800 items-center justify-center pr-[15px] rounded-r-lg border-l-0"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </label>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="flex items-center justify-center whitespace-nowrap h-12 px-6 rounded-lg w-full bg-primary text-white text-base font-bold leading-normal tracking-[-0.015em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordMutation.isPending ? '재설정 중...' : '비밀번호 재설정'}
              </button>
            </form>

            {/* 재발송 링크 */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                인증 코드를 받지 못하셨나요?{' '}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={sendCodeMutation.isPending}
                  className="font-bold text-primary hover:underline disabled:opacity-50"
                >
                  다시 받기
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


