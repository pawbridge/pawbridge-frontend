import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getAuthSessionVersion, useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth.api';
import { canSeePetMarket } from '../../lib/petMarket';

const palette = {
  text: 'text-brand-ink',
  icon: 'text-brand-accent',
  navigation: 'hover:text-brand-accent hover:underline',
  active: 'aria-[current=page]:text-brand-accent aria-[current=page]:underline',
  filled: 'bg-brand text-brand-ink hover:bg-brand-hover',
  outline: 'text-brand-accent border-brand-border',
  border: 'border-brand-border dark:border-border-dark',
  focus: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus',
};

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProtectedMenuOpen, setIsProtectedMenuOpen] = useState(false);
  const [isProtectedMobileOpen, setIsProtectedMobileOpen] = useState(true);
  const protectedMenuRef = useRef<HTMLDivElement>(null);
  const protectedMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const isProtectedSection = pathname === '/animals' || pathname === '/shelters' || pathname === '/animals/stats';
  const user = useAuthStore((state) => state.user);
  const showPetMarket = canSeePetMarket(user?.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isProtectedMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!protectedMenuRef.current?.contains(event.target as Node)) setIsProtectedMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [isProtectedMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeProtectedMenu = () => setIsProtectedMenuOpen(false);

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
          <nav aria-label="주 메뉴" className="hidden xl:flex items-center gap-5">
            <div
              ref={protectedMenuRef}
              className={`relative flex h-11 items-center rounded-full ${isProtectedSection ? 'bg-brand' : ''}`}
              onMouseLeave={() => {
                if (!protectedMenuRef.current?.contains(document.activeElement)) closeProtectedMenu();
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) closeProtectedMenu();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && isProtectedMenuOpen) {
                  event.preventDefault();
                  closeProtectedMenu();
                  protectedMenuButtonRef.current?.focus();
                }
              }}
            >
              <NavLink
                to="/animals"
                end
                onClick={closeProtectedMenu}
                onMouseEnter={() => setIsProtectedMenuOpen(true)}
                className={`flex h-11 items-center rounded-l-full pl-4 pr-1 text-sm font-semibold ${palette.text} dark:text-gray-200 ${palette.focus}`}
              >
                보호동물 검색
              </NavLink>
              <button
                ref={protectedMenuButtonRef}
                type="button"
                aria-label="보호동물 관련 메뉴"
                aria-expanded={isProtectedMenuOpen}
                aria-controls="protected-animal-navigation"
                className={`flex h-11 w-7 items-center justify-center rounded-r-full ${palette.text} dark:text-gray-200 ${palette.focus}`}
                onClick={() => setIsProtectedMenuOpen((open) => !open)}
              >
                <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className={`h-3 w-3 motion-safe:transition-transform ${isProtectedMenuOpen ? 'rotate-180' : ''}`}>
                  <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div id="protected-animal-navigation" className={`absolute left-0 top-full z-50 w-[352px] pt-2 ${isProtectedMenuOpen ? '' : 'hidden'}`}>
                <div className={`rounded-2xl border ${palette.border} bg-white p-2 shadow-xl dark:bg-background-dark`}>
                  {[
                    { to: '/animals', title: '보호동물 검색', description: '새로운 가족을 기다리는 동물' },
                    { to: '/shelters', title: '보호소 찾기', description: '지역별 보호소와 보호 중인 동물' },
                    { to: '/animals/stats', title: '유기동물 현황', description: '전국 구조·보호·입양 현황' },
                  ].map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      onClick={closeProtectedMenu}
                      className={({ isActive }) => `flex min-h-16 flex-col justify-center rounded-xl px-4 py-2 hover:bg-brand-soft dark:hover:bg-gray-800 ${isActive ? 'bg-brand-soft dark:bg-gray-800' : ''} ${palette.focus}`}
                    >
                      <span className={`text-sm font-semibold ${palette.text} dark:text-white`}>{item.title}</span>
                      <span className="mt-1 text-xs text-brand-muted dark:text-gray-400">{item.description}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
            <NavLink to="/animals/lost" className={`${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} ${palette.active} ${palette.focus}`}>실종동물 찾기</NavLink>

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
              onClick={() => {
                setIsMobileMenuOpen((open) => !open);
                setIsProtectedMobileOpen(true);
              }}
            >
              <span className="material-symbols-outlined">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <nav id="mobile-navigation" aria-label="모바일 메뉴" className={`max-h-[calc(100dvh-4rem)] overflow-y-auto border-b py-4 xl:hidden ${palette.border}`}>
            <div className="flex flex-col gap-1">
              <div className={`flex min-h-11 items-center rounded-xl ${isProtectedSection ? 'bg-brand' : 'bg-brand-soft dark:bg-gray-800'}`}>
                <NavLink to="/animals" end onClick={closeMobileMenu} className={`flex min-h-11 flex-1 items-center rounded-l-xl px-4 text-sm font-semibold ${palette.text} dark:text-white ${palette.focus}`}>보호동물 검색</NavLink>
                <button
                  type="button"
                  aria-label="보호동물 관련 메뉴"
                  aria-expanded={isProtectedMobileOpen}
                  aria-controls="protected-animal-mobile-navigation"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl ${palette.text} dark:text-white ${palette.focus}`}
                  onClick={() => setIsProtectedMobileOpen((open) => !open)}
                >
                  <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className={`h-3 w-3 motion-safe:transition-transform ${isProtectedMobileOpen ? 'rotate-180' : ''}`}>
                    <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div id="protected-animal-mobile-navigation" className={`pb-2 pl-3 ${isProtectedMobileOpen ? '' : 'hidden'}`}>
                {[
                  { to: '/shelters', title: '보호소 찾기', description: '지역별 보호소와 보호 중인 동물' },
                  { to: '/animals/stats', title: '유기동물 현황', description: '전국 구조·보호·입양 현황' },
                ].map((item) => (
                  <NavLink key={item.to} to={item.to} end onClick={closeMobileMenu} className={({ isActive }) => `flex min-h-14 flex-col justify-center rounded-xl px-4 py-2 hover:bg-brand-soft dark:hover:bg-gray-800 ${isActive ? 'bg-brand-soft dark:bg-gray-800' : ''} ${palette.focus}`}>
                    <span className={`text-sm font-medium ${palette.text} dark:text-white`}>{item.title}</span>
                    <span className="mt-0.5 text-xs text-brand-muted dark:text-gray-400">{item.description}</span>
                  </NavLink>
                ))}
              </div>
              <NavLink to="/animals/lost" onClick={closeMobileMenu} className={`flex min-h-11 items-center px-4 text-sm font-medium ${palette.text} dark:text-gray-300 ${palette.active} ${palette.focus}`}>실종동물 찾기</NavLink>

              <NavLink to="/travel" onClick={closeMobileMenu} className={`flex min-h-11 items-center px-4 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.active} ${palette.focus}`}>
                동반여행
              </NavLink>
              <Link
                to="/adoption"
                className={`flex min-h-11 items-center px-4 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={closeMobileMenu}
              >
                입양후기
              </Link>
              <Link
                to="/community"
                className={`flex min-h-11 items-center px-4 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={closeMobileMenu}
              >
                커뮤니티
              </Link>
              {showPetMarket && <Link
                to="/products"
                className={`flex min-h-11 items-center px-4 ${palette.text} dark:text-gray-300 text-sm font-medium ${palette.navigation} transition-colors ${palette.focus}`}
                onClick={closeMobileMenu}
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
