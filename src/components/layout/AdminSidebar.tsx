import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  
  // 상품관리 드롭다운이 열려있어야 하는 경우
  const shouldProductMenuBeOpen = isActive('/admin/products') || isActive('/products/new') || isActive('/admin/products/:productId/edit');
  const shouldOptionMenuBeOpen = isActive('/admin/option-groups');
  
  // 초기 상태 설정
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(shouldProductMenuBeOpen);
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(shouldOptionMenuBeOpen);
  
  // 경로 변경 시 드롭다운 상태 업데이트
  useEffect(() => {
    setIsProductMenuOpen(shouldProductMenuBeOpen);
    setIsOptionMenuOpen(shouldOptionMenuBeOpen);
  }, [location.pathname]);

  return (
    <aside className="w-64 h-full flex flex-col bg-surface-light dark:bg-surface-dark border-r border-[#e5e7eb] dark:border-gray-700 flex-shrink-0 z-20">
      <Link to="/" className="p-6 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
        <div className="size-10 rounded-full bg-primary flex items-center justify-center text-text-main">
          <span className="material-symbols-outlined text-[24px]">pets</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-text-main dark:text-white text-lg font-bold leading-tight">PawBridge</h1>
          <p className="text-text-secondary text-xs font-medium">관리자 콘솔</p>
        </div>
      </Link>
      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/admin/dashboard')
              ? 'bg-primary/20 text-text-main dark:text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
          } group`}
        >
          <span
            className={`material-symbols-outlined ${
              isActive('/admin/dashboard') ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
            }`}
            style={{ fontVariationSettings: isActive('/admin/dashboard') ? "'FILL' 1" : "'FILL' 0" }}
          >
            dashboard
          </span>
          <span className={`text-sm ${isActive('/admin/dashboard') ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
            대시보드
          </span>
        </Link>
        <Link
          to="/admin/statistics"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/admin/statistics')
              ? 'bg-primary/20 text-text-main dark:text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
          } group`}
        >
          <span
            className={`material-symbols-outlined ${
              isActive('/admin/statistics') ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
            }`}
            style={{ fontVariationSettings: isActive('/admin/statistics') ? "'FILL' 1" : "'FILL' 0" }}
          >
            bar_chart
          </span>
          <span className={`text-sm ${isActive('/admin/statistics') ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
            통계
          </span>
        </Link>
        <Link
          to="/admin/users"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/admin/users')
              ? 'bg-primary/20 text-text-main dark:text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
          } group`}
        >
          <span
            className={`material-symbols-outlined ${
              isActive('/admin/users') ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
            }`}
            style={{ fontVariationSettings: isActive('/admin/users') ? "'FILL' 1" : "'FILL' 0" }}
          >
            group
          </span>
          <span className={`text-sm ${isActive('/admin/users') ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
            회원 관리
          </span>
        </Link>
        <Link
          to="/admin/posts"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/admin/posts')
              ? 'bg-primary/20 text-text-main dark:text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
          } group`}
        >
          <span
            className={`material-symbols-outlined ${
              isActive('/admin/posts') ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
            }`}
            style={{ fontVariationSettings: isActive('/admin/posts') ? "'FILL' 1" : "'FILL' 0" }}
          >
            article
          </span>
          <span className={`text-sm ${isActive('/admin/posts') ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
            게시글 관리
          </span>
        </Link>
        <Link
          to="/admin/categories"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isActive('/admin/categories')
              ? 'bg-primary/20 text-text-main dark:text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
          } group`}
        >
          <span
            className={`material-symbols-outlined ${
              isActive('/admin/categories') ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
            }`}
            style={{ fontVariationSettings: isActive('/admin/categories') ? "'FILL' 1" : "'FILL' 0" }}
          >
            category
          </span>
          <span className={`text-sm ${isActive('/admin/categories') ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
            카테고리 관리
          </span>
        </Link>
        <div className="mt-2">
          <button
            onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
              shouldProductMenuBeOpen
                ? 'bg-primary/20 text-text-main dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined ${
                  shouldProductMenuBeOpen ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
                }`}
                style={{ fontVariationSettings: shouldProductMenuBeOpen ? "'FILL' 1" : "'FILL' 0" }}
              >
                inventory_2
              </span>
              <span className={`text-sm ${shouldProductMenuBeOpen ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
                상품 관리
              </span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
          {isProductMenuOpen && (
            <div className="flex flex-col mt-1 gap-1">
              <Link
                to="/admin/products"
                className={`pl-11 flex items-center gap-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive('/admin/products')
                    ? 'bg-primary/10 text-primary dark:text-primary font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white'
                }`}
              >
                상품 목록
              </Link>
              <Link
                to="/products/new"
                className={`pl-11 flex items-center gap-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive('/products/new')
                    ? 'bg-primary/10 text-primary dark:text-primary font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white'
                }`}
              >
                상품 등록
              </Link>
            </div>
          )}
        </div>
        <div className="mt-2 mb-4">
          <button
            onClick={() => setIsOptionMenuOpen(!isOptionMenuOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${
              shouldOptionMenuBeOpen
                ? 'bg-primary/20 text-text-main dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`material-symbols-outlined ${
                  shouldOptionMenuBeOpen ? 'text-text-main dark:text-white' : 'group-hover:text-text-main dark:group-hover:text-white transition-colors'
                }`}
                style={{ fontVariationSettings: shouldOptionMenuBeOpen ? "'FILL' 1" : "'FILL' 0" }}
              >
                tune
              </span>
              <span className={`text-sm ${shouldOptionMenuBeOpen ? 'font-semibold' : 'font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors'}`}>
                옵션 관리
              </span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isOptionMenuOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
          {isOptionMenuOpen && (
            <div className="flex flex-col mt-1 gap-1">
              <Link
                to="/admin/option-groups"
                className={`pl-11 flex items-center gap-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive('/admin/option-groups')
                    ? 'bg-primary/10 text-primary dark:text-primary font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white'
                }`}
              >
                옵션 그룹 관리
              </Link>
            </div>
          )}
        </div>
      </nav>
      <div className="p-4 border-t border-[#e5e7eb] dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary hover:bg-primary-dark transition-colors text-text-main font-bold text-sm tracking-wide shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
