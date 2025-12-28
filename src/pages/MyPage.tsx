import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getMyInfo, updateNickname, updatePassword } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import type { UpdateNicknameRequest, PasswordUpdateRequest } from '../types/api.types';

export default function MyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [nicknameInput, setNicknameInput] = useState('');
  const [passwordData, setPasswordData] = useState<PasswordUpdateRequest>({
    currentPassword: '',
    newPassword: '',
  });

  // 내 정보 조회
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfo,
  });

  // 닉네임 변경 mutation
  const updateNicknameMutation = useMutation({
    mutationFn: (data: UpdateNicknameRequest) => updateNickname(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInfo'] });
      alert('닉네임이 변경되었습니다.');
      setNicknameInput('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '닉네임 변경에 실패했습니다.');
    },
  });

  // 비밀번호 변경 mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordUpdateRequest) => updatePassword(data),
    onSuccess: () => {
      alert('비밀번호가 변경되었습니다.');
      setPasswordData({ currentPassword: '', newPassword: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    },
  });

  // 닉네임 변경 핸들러
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (nicknameInput.length < 2 || nicknameInput.length > 30) {
      alert('닉네임은 2~30자여야 합니다.');
      return;
    }
    updateNicknameMutation.mutate({ nickname: nicknameInput });
  };

  // 비밀번호 변경 핸들러
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  // 권한 한글 변환
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_USER':
        return '일반 회원';
      case 'ROLE_ADMIN':
        return '관리자';
      case 'ROLE_SHELTER':
        return '보호소 회원';
      default:
        return role;
    }
  };

  // 가입 경로 한글 변환
  const getProviderLabel = (provider: string | null) => {
    switch (provider) {
      case 'LOCAL':
        return '이메일 가입';
      case 'GOOGLE':
        return '구글 가입';
      case 'KAKAO':
        return '카카오 가입';
      default:
        return '이메일 가입';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* 사이드바 */}
          <aside className="md:w-1/4 lg:w-1/5">
            <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800/20 rounded-xl shadow-sm sticky top-24">
              {/* 프로필 정보 */}
              <div className="flex gap-4 items-center pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-text-main dark:text-gray-100 text-base font-bold leading-normal">
                    {userInfo.name}
                  </h1>
                  <p className="text-primary dark:text-green-300 text-sm font-normal leading-normal">
                    {userInfo.email}
                  </p>
                </div>
              </div>

              {/* 메뉴 */}
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'profile' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    person
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'profile'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    프로필 정보
                  </p>
                </button>

                <Link
                  to="/favorite-animals"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
                >
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">pets</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">내가 찜한 동물</p>
                </Link>

                {userInfo.role === 'ROLE_SHELTER' && (
                  <Link
                    to="/registered-animals"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
                  >
                    <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">home</span>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">내 보호소가 등록한 동물</p>
                  </Link>
                )}

                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
                >
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">favorite</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">나의 위시리스트</p>
                </Link>

                <Link
                  to="/cart"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
                >
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">shopping_cart</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">나의 장바구니</p>
                </Link>

                <Link
                  to="/orders"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group"
                >
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">receipt_long</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-normal">나의 주문 목록</p>
                </Link>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'password'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'password' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    lock_reset
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'password'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    비밀번호 변경
                  </p>
                </button>
              </nav>

              {/* 로그아웃 */}
              <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <span className="material-symbols-outlined text-red-500">logout</span>
                  <p className="text-red-500 text-sm font-medium leading-normal">로그아웃</p>
                </button>
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 md:w-3/4 lg:w-4/5">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                마이페이지
              </h1>
            </div>

            <div className="bg-white dark:bg-gray-800/20 p-6 sm:p-8 rounded-xl shadow-sm">
              {activeTab === 'profile' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    프로필 정보
                  </h2>

                  <div className="mt-8 space-y-6">
                    {/* 기본 정보 (읽기 전용) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          이메일 주소
                        </label>
                        <input
                          type="email"
                          value={userInfo.email}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                        <input
                          type="text"
                          value={userInfo.name}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          닉네임
                        </label>
                        <input
                          type="text"
                          value={userInfo.nickname || '미설정'}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          가입 경로
                        </label>
                        <input
                          type="text"
                          value={getProviderLabel(userInfo.provider)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">권한</label>
                        <input
                          type="text"
                          value={getRoleLabel(userInfo.role)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          가입일시
                        </label>
                        <input
                          type="text"
                          value={formatDate(userInfo.createdAt)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* 닉네임 변경 폼 */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">닉네임 변경</h3>
                      <form onSubmit={handleNicknameSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            새 닉네임
                          </label>
                          <input
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder="2~30자의 한글, 영문, 숫자"
                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            한글, 영문, 숫자를 사용할 수 있으며 띄어쓰기가 불가능합니다.
                          </p>
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setNicknameInput('')}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-text-main dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={updateNicknameMutation.isPending}
                            className="px-6 py-2 bg-primary text-text-main rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
                          >
                            {updateNicknameMutation.isPending ? '변경 중...' : '변경하기'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    비밀번호 변경
                  </h2>

                  {userInfo.provider !== 'LOCAL' && userInfo.provider !== null ? (
                    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        {getProviderLabel(userInfo.provider)} 계정은 비밀번호를 변경할 수 없습니다.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          현재 비밀번호
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          새 비밀번호
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          8~20자의 영문, 숫자, 특수문자를 포함해야 합니다.
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setPasswordData({ currentPassword: '', newPassword: '' })}
                          className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-text-main dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                          className="px-6 py-2 bg-primary text-text-main rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
                        >
                          {updatePasswordMutation.isPending ? '변경 중...' : '변경하기'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
