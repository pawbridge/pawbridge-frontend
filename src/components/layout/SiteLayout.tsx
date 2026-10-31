import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from '../common/ErrorBoundary';
import ScreenErrorFallback from '../common/ScreenErrorFallback';

// 일반 화면의 공통 틀. 화면은 <Outlet /> 자리에 자기 내용(flex-1인 main)만 그린다.
// 헤더는 화면을 옮겨 다녀도 다시 만들어지지 않는다.
// 화면이 그리다 오류를 내면 헤더·푸터는 그대로 두고 내용 자리에만 안내 카드를 보여 준다. 다른 주소로 이동하면 다시 그린다.
export default function SiteLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display dark:bg-background-dark">
      <Header />
      <ErrorBoundary resetKey={location.key} fallback={<ScreenErrorFallback />}>
        <Outlet />
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
