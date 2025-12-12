import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signup, sendEmailVerificationCode, verifyEmailCode } from '../api/auth.api';
import type { SignupRequest } from '../types/api.types';

// UI용 폼 데이터 타입 (userType 사용)
interface SignupFormData {
  email: string;
  name: string;
  password: string;
  rePassword: string;
  userType: 'GENERAL' | 'SHELTER';
  careRegNo: string;  // 보호소 등록번호
}

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    name: '',
    password: '',
    rePassword: '',
    userType: 'GENERAL',
    careRegNo: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  // 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // 이메일 인증 코드 발송 mutation
  const sendCodeMutation = useMutation({
    mutationFn: sendEmailVerificationCode,
    onSuccess: () => {
      alert('인증 코드가 이메일로 발송되었습니다.');
      setCodeSent(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '인증 코드 발송에 실패했습니다';
      alert(message);
    },
  });

  // 이메일 인증 코드 검증 mutation
  const verifyCodeMutation = useMutation({
    mutationFn: verifyEmailCode,
    onSuccess: (data) => {
      if (data.verified) {
        alert('이메일 인증이 완료되었습니다!');
        setEmailVerified(true);
      } else {
        alert('인증 코드가 올바르지 않습니다.');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '인증 코드 검증에 실패했습니다';
      alert(message);
    },
  });

  // 회원가입 mutation
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      alert(`회원가입 성공!\n환영합니다, ${data.name}님!`);
      navigate('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '회원가입에 실패했습니다';
      alert(message);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignupFormData, string>> = {};

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = '이메일을 입력하세요';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력하세요';
    }

    // 이메일 인증 확인
    if (!emailVerified) {
      alert('이메일 인증을 완료해주세요');
      return false;
    }

    // 이름 검증
    if (!formData.name) {
      newErrors.name = '이름을 입력하세요';
    } else if (formData.name.length > 20) {
      newErrors.name = '이름은 최대 20자까지 입력 가능합니다';
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력하세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    }

    // 비밀번호 확인 검증
    if (!formData.rePassword) {
      newErrors.rePassword = '비밀번호 확인을 입력하세요';
    } else if (formData.password !== formData.rePassword) {
      newErrors.rePassword = '비밀번호가 일치하지 않습니다';
    }

    // 보호소 등록번호 검증 (SHELTER 회원인 경우 필수)
    if (formData.userType === 'SHELTER') {
      if (!formData.careRegNo) {
        newErrors.careRegNo = '보호소 등록번호를 입력하세요';
      } else if (formData.careRegNo.length > 50) {
        newErrors.careRegNo = '보호소 등록번호는 최대 50자까지 입력 가능합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 이메일 인증 코드 발송
  const handleSendCode = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      alert('이메일을 입력하세요');
      return;
    }
    if (!emailRegex.test(formData.email)) {
      alert('유효한 이메일 주소를 입력하세요');
      return;
    }

    sendCodeMutation.mutate({ email: formData.email });
  };

  // 인증 코드 입력 처리
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // 자동 포커스 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`verify-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // 백스페이스 처리
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`verify-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 인증 코드 검증
  const handleVerifyCode = () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      alert('6자리 인증 코드를 입력하세요');
      return;
    }

    verifyCodeMutation.mutate({
      email: formData.email,
      code,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // UI의 userType을 백엔드 role 형식으로 변환
      const signupRequest: SignupRequest = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        rePassword: formData.rePassword,
        role: formData.userType === 'SHELTER' ? 'ROLE_SHELTER' : 'ROLE_USER',
        careRegNo: formData.userType === 'SHELTER' ? formData.careRegNo : undefined,
      };

      signupMutation.mutate(signupRequest);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-lg space-y-8">
        {/* Page Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white sm:text-4xl">
            회원가입
          </h1>
        </div>

        {/* Form Container */}
        <div className="rounded-xl border border-gray-200/50 bg-white/50 p-6 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/50 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <p className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100">
                회원 유형
              </p>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white p-4 text-center text-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 dark:has-[:checked]:text-primary">
                  <input
                    type="radio"
                    name="userType"
                    value="GENERAL"
                    checked={formData.userType === 'GENERAL'}
                    onChange={(e) => handleChange('userType', e.target.value)}
                    className="sr-only"
                  />
                  <span>일반 회원</span>
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white p-4 text-center text-gray-700 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 dark:has-[:checked]:text-primary">
                  <input
                    type="radio"
                    name="userType"
                    value="SHELTER"
                    checked={formData.userType === 'SHELTER'}
                    onChange={(e) => handleChange('userType', e.target.value)}
                    className="sr-only"
                  />
                  <span>보호소 회원</span>
                </label>
              </div>
            </div>

            {/* Email Field with Verification */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="email">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="이메일 주소를 입력하세요"
                  className={`block flex-1 rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                    errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={emailVerified || sendCodeMutation.isPending}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={emailVerified || sendCodeMutation.isPending}
                  className="whitespace-nowrap rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailVerified ? '인증완료' : sendCodeMutation.isPending ? '발송중...' : '인증코드 발송'}
                </button>
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Verification Code Input - 인증 코드 발송 후 표시 */}
            {codeSent && !emailVerified && (
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  인증 코드 <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-between gap-2">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`verify-code-${index}`}
                      type="number"
                      min="0"
                      max="9"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="h-14 w-full text-center text-lg font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      disabled={verifyCodeMutation.isPending}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeMutation.isPending}
                  className="w-full mt-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyCodeMutation.isPending ? '확인 중...' : '인증 확인'}
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  이메일로 발송된 6자리 인증 코드를 입력하세요.
                </p>
              </div>
            )}

            {/* Email Verified Success Message */}
            {emailVerified && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
                  check_circle
                </span>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  이메일 인증이 완료되었습니다
                </p>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="name">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
                className={`block w-full rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={!emailVerified || signupMutation.isPending}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="password">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={`block w-full rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={!emailVerified || signupMutation.isPending}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="rePassword">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="rePassword"
                name="rePassword"
                value={formData.rePassword}
                onChange={(e) => handleChange('rePassword', e.target.value)}
                placeholder="비밀번호를 다시 한번 입력하세요"
                className={`block w-full rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                  errors.rePassword
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={!emailVerified || signupMutation.isPending}
              />
              {errors.rePassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.rePassword}</p>
              )}
            </div>

            {/* Care Registration Number (보호소 등록번호) - SHELTER만 표시 */}
            {formData.userType === 'SHELTER' && (
              <div className="space-y-2">
                <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="careRegNo">
                  보호소 등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="careRegNo"
                  name="careRegNo"
                  value={formData.careRegNo}
                  onChange={(e) => handleChange('careRegNo', e.target.value)}
                  placeholder="보호소 등록번호를 입력하세요 (예: 348527200900001)"
                  className={`block w-full rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                    errors.careRegNo
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!emailVerified || signupMutation.isPending}
                />
                {errors.careRegNo && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.careRegNo}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  보호소 직원만 가입 가능합니다. 등록번호를 정확히 입력해주세요.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!emailVerified || signupMutation.isPending}
                className="flex w-full justify-center rounded-lg bg-primary px-3 py-4 text-base font-bold leading-6 text-gray-900 shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {signupMutation.isPending ? '처리 중...' : '회원가입 완료'}
              </button>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              이미 회원이신가요?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-dark hover:text-primary dark:text-primary dark:hover:text-primary-light"
              >
                로그인
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}


