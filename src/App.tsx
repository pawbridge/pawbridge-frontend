import { Routes, Route, useLocation, Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuthStore } from './store/authStore.ts';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Animals from './pages/Animals.tsx';
import AnimalDetail from './pages/AnimalDetail.tsx';
import Products from './pages/Products.tsx';
import ProductDetail from './pages/ProductDetail.tsx';
import Cart from './pages/Cart.tsx';
import Checkout from './pages/Checkout.tsx';
import OrderComplete from './pages/OrderComplete.tsx';
import NotFound from './pages/NotFound.tsx';

// 개발 환경에서만 window에 등록 (디버깅용)
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto mt-24 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4 text-center">
          <p className="text-xl font-bold text-text-light dark:text-text-dark">로그인이 필요합니다</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            펫마켓은 회원만 이용 가능합니다. 로그인 후 다시 이용해 주세요.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-primary text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
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
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/animals" element={<Animals />} />
      <Route path="/animals/:id" element={<AnimalDetail />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-complete"
        element={
          <ProtectedRoute>
            <OrderComplete />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;