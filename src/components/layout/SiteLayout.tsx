import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

// 일반 화면의 공통 틀. 화면은 <Outlet /> 자리에 자기 내용(flex-1인 main)만 그린다.
// 헤더는 화면을 옮겨 다녀도 다시 만들어지지 않는다.
export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display dark:bg-background-dark">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
