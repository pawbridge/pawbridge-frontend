import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              to="/reviews"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              입양 후기
            </Link>
            <Link
              to="/community"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              커뮤니티
            </Link>
            <Link
              to="/shop"
              className="text-primary-content dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary transition-colors"
            >
              상점
            </Link>
          </nav>

          {/* 로그인 버튼 & 모바일 메뉴 */}
          <div className="flex items-center gap-4">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-primary-content text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
              <span className="truncate">로그인</span>
            </button>
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
                to="/reviews"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                입양 후기
              </Link>
              <Link
                to="/community"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              <Link
                to="/shop"
                className="text-primary-content dark:text-gray-300 text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                상점
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

