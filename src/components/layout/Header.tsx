import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth.api';
import { canSeePetMarket } from '../../lib/petMarket';

interface HeaderProps {
  colorScheme?: 'default' | 'warm';
}

export default function Header({ colorScheme = 'default' }: HeaderProps) {
  const warm = colorScheme === 'warm';
  const palette = {
    text: warm ? 'text-brand-ink' : 'text-primary-content',
    icon: warm ? 'text-brand-ink dark:text-brand' : 'text-primary',
    navigation: warm
      ? 'hover:text-brand-ink hover:underline dark:hover:text-brand'
      : 'hover:text-primary dark:hover:text-primary',
    active: warm
      ? 'aria-[current=page]:text-brand-ink aria-[current=page]:underline dark:aria-[current=page]:text-brand'
      : 'aria-[current=page]:text-emerald-700 dark:aria-[current=page]:text-primary',
    shelterHover: warm ? 'hover:text-brand-ink hover:underline dark:hover:text-brand' : 'hover:text-emerald-700',
    filled: warm ? 'bg-brand text-brand-ink' : 'bg-primary text-white',
    outline: warm ? 'text-brand-ink dark:text-brand border-brand-border' : 'text-primary dark:text-primary border-primary',
    border: warm ? 'border-brand-border' : 'border-primary/20',
    focus: warm ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink dark:focus-visible:outline-brand' : '',
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const showPetMarket = canSeePetMarket(user?.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const sessionVersion = getAuthSessionVersion();
    try {
      await logout();
      if (sessionVersion === getAuthSessionVersion()) alert('로그아웃되었습니다.');
    } catch {
      // 서버 로그아웃 실패와 무관하게 현재 세션의 로컬 정보는 정리한다.
    } finally {
      // 대기 중 다른 계정으로 로그인했다면 새 계정을 로그아웃시키지 않는다.
      if (sessionVersion === getAuthSessionVersion()) {
        clearAuth();
        navigate('/');
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between whitespace-nowrap border-b border-solid ${palette.border} h-16`}>
          {/* 로고 */}
          <Link to="/" className={`flex items-center gap-2 sm:gap-4 ${palette.text} dark:text-white`}>
            <div className={`${palette.icon} text-2xl`}>
              <span className="material-symbols-outlined">pets</span>
            </div>
            <h2 className={`${palette.text} dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]`}>
              PawBridge
            </h2>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden xl:flex items-center gap-6">
            <Link
              to="/animals"
              className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.focus}`}
            >
              동물 검색
            </Link>
            <Link to="/animals/lost" className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} ${palette.focus}`}>실종동물 찾기</Link>
            <NavLink to="/shelters" className={`${palette.text} text-sm font-medium ${palette.shelterHover} ${palette.active} dark:text-gray-300 ${palette.focus}`}>보호소 찾기</NavLink>
            <Link
              to="/animals/stats"
              className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.focus}`}
            >
              유기동물 현황
            </Link>

            <NavLink to="/travel" className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.active} ${palette.focus}`}>
              동반여행
            </NavLink>
            <Link
              to="/adoption"
              className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.focus}`}
            >
              입양후기
            </Link>
            <Link
              to="/community"
              className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.focus}`}
            >
              커뮤니티
            </Link>
            {showPetMarket && <Link
              to="/products"
              className={`${palette.text} dark:text-gray-300 text-sm font-medium leading-normal ${palette.navigation} transition-colors ${palette.focus}`}
            >
              펫마켓
            </Link>}

          </nav>

          {/* 로그인 상태에 따른 버튼 & 모바일 메뉴 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              // 로그인된 경우: 찜 아이콘 + 사용자 이름 + 관리자 링크(관리자만) + 로그아웃 버튼
              <>
                {showPetMarket && <Link
                  to="/wishlist"
                  className="relative hidden h-9 w-9 items-center justify-center rounded-full text-subtext-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors sm:flex"
                  title="찜한 상품"
                >
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </Link>}
                <span className={`hidden sm:block ${palette.text} dark:text-gray-300 text-sm font-medium`}>
                  {user.name}님
                </span>
                {user.role === 'ROLE_ADMIN' ? (
                  <Link
                    to="/admin/dashboard"
                    className={`hidden sm:flex items-center gap-2 min-w-[84px] max-w-[480px] cursor-pointer justify-center overflow-hidden rounded-full h-10 px-4 ${palette.filled} text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity ${palette.focus}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">dashboard</span>
                    <span className="truncate">관리자</span>
                  </Link>
                ) : (
                  <Link
                    to="/mypage"
                    className={`hidden sm:flex items-center gap-2 min-w-[84px] max-w-[480px] cursor-pointer justify-center overflow-hidden rounded-full h-10 px-4 ${palette.filled} text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity ${palette.focus}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    <span className="truncate">마이페이지</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white dark:bg-gray-700 ${palette.outline} text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity border ${palette.focus}`}
                >
                  <span className="truncate">로그아웃</span>
                </button>
              </>
            ) : (
              // 로그인 안 된 경우: 로그인 + 회원가입 버튼
              <>
                <Link
                  to="/login"
                  className={`hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-white dark:bg-gray-700 ${palette.outline} text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity border ${palette.focus}`}
                >
                  <span className="truncate">로그인</span>
                </Link>
                <Link
                  to="/signup"
                  className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 ${palette.filled} text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity ${palette.focus}`}
                >
                  <span className="truncate">회원가입</span>
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              className={`flex h-11 w-11 shrink-0 items-center justify-center xl:hidden ${palette.text} dark:text-white`}
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
          <nav id="mobile-navigation" className={`xl:hidden py-4 border-b ${palette.border}`}>
            <div className="flex flex-col space-y-4">
              <Link
                to="/animals"
                className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                동물 검색
              </Link>
              <Link to="/animals/lost" onClick={() => setIsMobileMenuOpen(false)} className={`block py-2 ${palette.text} dark:text-gray-300`}>실종동물 찾기</Link>
              <NavLink to="/shelters" onClick={() => setIsMobileMenuOpen(false)} className={`flex min-h-11 items-center ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.active} ${palette.focus}`}>보호소 찾기</NavLink>
              <Link
                to="/animals/stats"
                className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                유기동물 현황
              </Link>

              <NavLink to="/travel" onClick={() => setIsMobileMenuOpen(false)} className={`flex min-h-11 items-center ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.active} ${palette.focus}`}>
                동반여행
              </NavLink>
              <Link
                to="/adoption"
                className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                입양후기
              </Link>
              <Link
                to="/community"
                className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              {showPetMarket && <Link
                to="/products"
                className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                펫마켓
              </Link>}

              <div className={`pt-2 border-t ${palette.border} sm:hidden`}>
                {user ? (
                  <>
                    {showPetMarket && <Link
                      to="/wishlist"
                      className={`flex items-center gap-2 mb-2 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                      <span>찜한 상품</span>
                    </Link>}
                    <div className={`${palette.text} dark:text-gray-300 text-sm font-medium mb-2`}>
                      {user.name}님
                    </div>
                    {user.role === 'ROLE_ADMIN' ? (
                      <Link
                        to="/admin/dashboard"
                        className={`flex items-center gap-2 mb-2 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        <span>관리자 대시보드</span>
                      </Link>
                    ) : (
                      <Link
                        to="/mypage"
                        className={`flex items-center gap-2 mb-2 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
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
                      className={`block w-full text-left ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={`block ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
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
