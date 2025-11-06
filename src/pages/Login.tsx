import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api.ts';
import { useAuthStore } from '../store/authStore.ts';  // 추가!

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Zustand store 사용
  const setAuth = useAuthStore((state) => state.setAuth);  // 추가!

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // ✅ Zustand에 저장 (localStorage에도 자동 저장됨)
      setAuth(data.user, data.accessToken, data.refreshToken);
      
      alert('로그인 성공!');
      navigate('/');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '로그인에 실패했습니다');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          로그인
        </h1>

        {loginMutation.isError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            로그인에 실패했습니다
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
              disabled={loginMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="********"
              required
              disabled={loginMutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loginMutation.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}