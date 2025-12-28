import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth.api';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      alert('로그아웃되었습니다.');
    } finally {
      clearAuth();
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-4 text-primary-content dark:text-white">
            <div className="text-primary text-2xl">
              <span className="material-symbols-outlined">pets</span>
            </div>
            <h2 className="text-primary-content dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              포우 브릿지
            </h2>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-9">
            <Link
              to="/animals"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              동물 검색
            </Link>
            <Link
              to="/adoption"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              입양후기
            </Link>
            <Link
              to="/community"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              커뮤니티
            </Link>
            <Link
              to="/products"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              펫마켓
            </Link>
          </nav>

          {/* 로그인 상태에 따른 버튼 & 모바일 메뉴 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              // 로그인된 경우: 찜 아이콘 + 사용자 이름 + 관리자 링크(관리자만) + 로그아웃 버튼
              <>
                <Link
                  to="/wishlist"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-subtext-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="찜한 상품"
                >
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </Link>
                <span className="hidden sm:block text-primary-content dark:text-gray-300 text-sm font-medium">
                  {user.name}님
                </span>
                {user.role === 'ROLE_ADMIN' ? (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:flex items-center gap-2 min-w-[84px] max-w-[480px] cursor-pointer justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    <span className="truncate">관리자</span>
                  </Link>
                ) : (
                  <Link
                    to="/mypage"
                    className="hidden sm:flex items-center gap-2 min-w-[84px] max-w-[480px] cursor-pointer justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span className="truncate">마이페이지</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white dark:bg-gray-700 text-primary dark:text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity border border-primary"
                >
                  <span className="truncate">로그아웃</span>
                </button>
              </>
            ) : (
              // 로그인 안 된 경우: 로그인 + 회원가입 버튼
              <>
                <Link
                  to="/login"
                  className="hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white dark:bg-gray-700 text-primary dark:text-primary text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity border border-primary"
                >
                  <span className="truncate">로그인</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity"
                >
                  <span className="truncate">회원가입</span>
                </Link>
              </>
            )}
            <button
              className="md:hidden text-primary-content dark:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-b border-primary/20">
            <div className="flex flex-col space-y-4">
              <Link
                to="/animals"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                동물 검색
              </Link>
              <Link
                to="/adoption"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                입양후기
              </Link>
              <Link
                to="/community"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              <Link
                to="/products"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                펫마켓
              </Link>
              <div className="pt-2 border-t border-primary/20 sm:hidden">
                {user ? (
                  <>
                    <Link
                      to="/wishlist"
                      className="flex items-center gap-2 mb-2 text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                      <span>찜한 상품</span>
                    </Link>
                    <div className="text-primary-content dark:text-gray-300 text-sm font-medium mb-2">
                      {user.name}님
                    </div>
                    {user.role === 'ROLE_ADMIN' ? (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 mb-2 text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        <span>관리자 대시보드</span>
                      </Link>
                    ) : (
                      <Link
                        to="/mypage"
                        className="flex items-center gap-2 mb-2 text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        <span>마이페이지</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="block text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

