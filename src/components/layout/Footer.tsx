import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-primary/10 dark:bg-background-dark mt-16 md:mt-24 border-t border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* 브랜드 */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-primary-content dark:text-white">
              <div className="text-primary text-xl">
                <span className="material-symbols-outlined">pets</span>
              </div>
              <h2 className="text-lg font-bold">포우 브릿지</h2>
            </div>
            <p className="text-secondary-content dark:text-gray-400 text-sm mt-2">
              모든 동물들이 행복한 가정을 찾을 때까지.
            </p>
          </div>

          {/* 입양 */}
          <div className="text-sm">
            <h3 className="font-bold text-primary-content dark:text-white">입양</h3>
            <ul className="mt-4 space-y-2 text-secondary-content dark:text-gray-400">
              <li>
                <Link to="/animals" className="hover:text-primary transition-colors">
                  동물 검색
                </Link>
              </li>
            </ul>
          </div>

          {/* 참여 */}
          <div className="text-sm">
            <h3 className="font-bold text-primary-content dark:text-white">참여</h3>
            <ul className="mt-4 space-y-2 text-secondary-content dark:text-gray-400">
              <li>
                <Link to="/reviews" className="hover:text-primary transition-colors">
                  입양 후기
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-primary transition-colors">
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객센터 */}
          <div className="text-sm">
            <h3 className="font-bold text-primary-content dark:text-white">고객센터</h3>
            <ul className="mt-4 space-y-2 text-secondary-content dark:text-gray-400">
              <li>
                <Link to="/notices" className="hover:text-primary transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="border-t border-primary/20 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-secondary-content dark:text-gray-500">
          <p>© 2025 포우 브릿지. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms" className="hover:text-primary transition-colors">
              이용약관
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

