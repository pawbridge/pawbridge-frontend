import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signup } from '../api/auth.api';
import type { SignupRequest } from '../types/api.types';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    name: '',
    password: '',
    rePassword: '',
    userType: 'GENERAL',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupRequest, string>>>({});

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
    const newErrors: Partial<Record<keyof SignupRequest, string>> = {};

    // 이메일 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = '이메일을 입력하세요';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력하세요';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SignupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      signupMutation.mutate(formData);
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

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="email">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                className={`block w-full rounded-lg border p-3.5 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 sm:text-sm sm:leading-6 ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={signupMutation.isPending}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="name">
                이름
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
                disabled={signupMutation.isPending}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="password">
                비밀번호
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
                disabled={signupMutation.isPending}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-gray-100" htmlFor="rePassword">
                비밀번호 확인
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
                disabled={signupMutation.isPending}
              />
              {errors.rePassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{errors.rePassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={signupMutation.isPending}
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

