import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Animals from './pages/Animals.tsx';
import NotFound from './pages/NotFound.tsx';

// 개발 환경에서만 window에 등록 (디버깅용)
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
}

function App() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    alert('로그아웃되었습니다');
  };

  return (
    <div>
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link to="/" className="text-2xl font-bold text-blue-600">
              🐾 Pawbridge
            </Link>

            {/* 메뉴 */}
            <div className="flex items-center gap-6">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
              >
                홈
              </Link>
              <Link 
                to="/animals" 
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
              >
                동물 목록
              </Link>
              
              {/* 로그인 상태에 따라 다른 메뉴 */}
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {user.name}님
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 라우트 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;