import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// 로그인이 필요한 화면에 비로그인으로 들어왔을 때 보여 주는 안내 카드
export function LoginRequiredCard({ className = '' }: { className?: string }) {
  const location = useLocation();
  return (
    <div className={`mx-auto mt-24 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4 text-center ${className}`}>
      <p className="text-xl font-bold text-text-light dark:text-text-dark">로그인이 필요합니다</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        이 기능은 로그인이 필요합니다. 로그인 후 다시 이용해 주세요.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          to="/login"
          state={{ from: location.pathname + location.search }}
          className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-brand text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          로그인
        </Link>
        <Link
          to="/"
          className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

// SiteLayout 안의 로그인 필요 화면 묶음. 비로그인이면 헤더·푸터는 그대로 두고 안내 카드만 보여 준다.
export default function RequireLogin() {
  const token = useAuthStore((state) => state.accessToken);
  if (!token) {
    return (
      <main className="w-full flex-1 px-4">
        <LoginRequiredCard />
      </main>
    );
  }
  return <Outlet />;
}
