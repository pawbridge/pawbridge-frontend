import Shelters from './pages/Shelters';
import ShelterDetail from './pages/ShelterDetail';
import AdminShelters from './pages/admin/AdminShelters';
import AdminShelterDetail from './pages/admin/AdminShelterDetail';
import AdminShelterApplications from './pages/admin/AdminShelterApplications';
import AdminShelterApplicationDetail from './pages/admin/AdminShelterApplicationDetail';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuthStore } from './store/authStore.ts';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import ResetPassword from './pages/ResetPassword.tsx';
import Animals from './pages/Animals.tsx';
import LostAnimalSearch from './pages/LostAnimalSearch.tsx';
import AnimalDetail from './pages/AnimalDetail.tsx';
import AnimalCreate from './pages/AnimalCreate.tsx';
import AnimalEdit from './pages/AnimalEdit.tsx';
import Products from './pages/Products.tsx';
import ProductDetail from './pages/ProductDetail.tsx';
import ProductCreate from './pages/admin/ProductCreate.tsx';
import ProductEdit from './pages/admin/ProductEdit.tsx';
import AdminProductList from './pages/admin/AdminProductList.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminCategoryManagement from './pages/admin/AdminCategoryManagement.tsx';
import AdminOptionGroupManagement from './pages/admin/AdminOptionGroupManagement.tsx';
import Cart from './pages/Cart.tsx';
import Checkout from './pages/Checkout.tsx';
import OrderComplete from './pages/OrderComplete.tsx';
import Wishlist from './pages/Wishlist.tsx';
import Orders from './pages/Orders.tsx';
import OrderDetail from './pages/OrderDetail.tsx';
import AdminOrderList from './pages/admin/AdminOrderList.tsx';
import AdminOrderDetail from './pages/admin/AdminOrderDetail.tsx';
import AdminUserManagement from './pages/admin/AdminUserManagement.tsx';
import AdminUserDetail from './pages/admin/AdminUserDetail.tsx';
import AdminPostManagement from './pages/admin/AdminPostManagement.tsx';
import AdminPostDetail from './pages/admin/AdminPostDetail.tsx';
import AdminStatistics from './pages/admin/AdminStatistics.tsx';
import AdminVideoManagement from './pages/admin/AdminVideoManagement';
import MyPage from './pages/MyPage.tsx';
import FavoriteAnimals from './pages/FavoriteAnimals.tsx';
import RegisteredAnimals from './pages/RegisteredAnimals.tsx';
import NotFound from './pages/NotFound.tsx';
import CommunityList from './pages/CommunityList.tsx';
import CommunityDetail from './pages/CommunityDetail.tsx';
import CommunityCreate from './pages/CommunityCreate.tsx';
import AnimalReportForm from './pages/AnimalReportForm.tsx';
import AnimalReportDetail from './pages/AnimalReportDetail.tsx';
import AnimalReportList from './pages/AnimalReportList.tsx';
import LegacyAnimalReportRedirect from './pages/LegacyAnimalReportRedirect.tsx';
import CommunityEdit from './pages/CommunityEdit.tsx';
import AdoptionList from './pages/AdoptionList.tsx';
import AdoptionDetail from './pages/AdoptionDetail.tsx';
import AdoptionCreate from './pages/AdoptionCreate.tsx';
import AdoptionEdit from './pages/AdoptionEdit.tsx';
import OAuthCallback from './pages/OAuthCallback.tsx';
import AnimalStats from './pages/AnimalStats.tsx';
import Travel from './pages/Travel.tsx';
import TravelDetail from './pages/TravelDetail.tsx';
import Privacy from './pages/Privacy.tsx';
import Terms from './pages/Terms.tsx';
import PrivateNotes from './pages/PrivateNotes';
import PrivateNoteCompose from './pages/PrivateNoteCompose';
import PrivateNoteDetail from './pages/PrivateNoteDetail';
import PrivateNoteBlocks from './pages/PrivateNoteBlocks';
import MemberChats from './pages/MemberChats';
import VisitTracker from './components/visits/VisitTracker';
import SiteLayout from './components/layout/SiteLayout';
import AdminLayout from './components/layout/AdminLayout';
import RequireLogin, { LoginRequiredCard } from './components/layout/RequireLogin';

// 개발 환경에서만 window에 등록 (디버깅용)
if (import.meta.env.DEV) {
  Object.assign(window, { useAuthStore });
}

// SiteLayout 밖의 로그인 필요 화면에서 쓰는 전체 화면 안내
function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <div className="fixed inset-0 bg-black/40" />
        <LoginRequiredCard className="relative z-10" />
      </div>
    );
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto mt-24 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4 text-center">
          <p className="text-xl font-bold text-text-light dark:text-text-dark">로그인이 필요합니다</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            관리자 페이지는 로그인이 필요합니다.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: location.pathname }}
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
      </div>
    );
  }

  if (user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <div className="fixed inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto mt-24 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4 text-center">
          <p className="text-xl font-bold text-text-light dark:text-text-dark">접근 권한이 없습니다</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-brand text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
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
  const location = useLocation();
  return (
    <>
    <VisitTracker />
    <Routes>
      {/* 헤더·푸터를 함께 쓰는 화면 */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/animals" element={<Animals />} />
        <Route path="/animals/lost" element={<LostAnimalSearch />} />
        <Route path="/animals/stats" element={<AnimalStats />} />
        <Route path="/animals/:id" element={<AnimalDetail />} />
        <Route path="/reports/missing" element={<AnimalReportList kind="MISSING" />} />
        <Route path="/reports/sightings" element={<AnimalReportList kind="SIGHTING" />} />
        <Route path="/reports/:id" element={<AnimalReportDetail />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/community" element={<CommunityList />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
        <Route path="/adoption" element={<AdoptionList />} />
        <Route path="/adoption/:id" element={<AdoptionDetail />} />
        <Route path="/shelters" element={<Shelters />} />
        <Route path="/shelters/:registration" element={<ShelterDetail />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/travel/:contentId" element={<TravelDetail />} />
        <Route element={<RequireLogin />}>
          <Route path="/favorite-animals" element={<FavoriteAnimals />} />
          <Route path="/registered-animals" element={<RegisteredAnimals />} />
          <Route path="/reports/new" element={<AnimalReportForm />} />
          <Route path="/reports/:id/edit" element={<AnimalReportForm />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-complete" element={<OrderComplete />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/community/new" element={<CommunityCreate />} />
          <Route path="/community/:id/edit" element={<CommunityEdit />} />
          <Route path="/adoption/new" element={<AdoptionCreate />} />
          <Route path="/adoption/:id/edit" element={<AdoptionEdit />} />
          <Route path="/notes" element={<PrivateNotes />} />
          <Route path="/notes/new" element={<PrivateNoteCompose key={location.search} />} />
          <Route path="/notes/blocks" element={<PrivateNoteBlocks />} />
          <Route path="/notes/:id" element={<PrivateNoteDetail key={location.pathname} />} />
          <Route path="/chats" element={<MemberChats />} />
          <Route path="/chats/new" element={<MemberChats />} />
          <Route path="/chats/:roomId" element={<MemberChats />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      {/* New email signup is closed; social login creates the account. */}
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route
        path="/animals/new"
        element={
          <ProtectedRoute>
            <AnimalCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animals/:id/edit"
        element={
          <ProtectedRoute>
            <AnimalEdit />
          </ProtectedRoute>
        }
      />
      {/* 관리자 화면: 공통 틀(사이드바·상단바)과 관리자 확인을 한 번만 둔다 */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/products/new" element={<ProductCreate />} />
        <Route path="/admin/products" element={<AdminProductList />} />
        <Route path="/admin/products/:productId/edit" element={<ProductEdit />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/categories" element={<AdminCategoryManagement />} />
        <Route path="/admin/option-groups" element={<AdminOptionGroupManagement />} />
        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/videos" element={<AdminVideoManagement />} />
        <Route path="/admin/posts" element={<AdminPostManagement />} />
        <Route path="/admin/posts/:postId" element={<AdminPostDetail />} />
        <Route path="/admin/statistics" element={<AdminStatistics />} />
        <Route path="/admin/orders" element={<AdminOrderList />} />
        <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="/admin/shelters" element={<AdminShelters />} />
        <Route path="/admin/shelters/:registration" element={<AdminShelterDetail />} />
        <Route path="/admin/shelter-applications" element={<AdminShelterApplications />} />
        <Route path="/admin/shelter-applications/:id" element={<AdminShelterApplicationDetail />} />
      </Route>
      {/* 예전 커뮤니티 제보 주소는 독립 실종·목격 제보 주소로 넘긴다 */}
      <Route path="/community/reports/new" element={<LegacyAnimalReportRedirect />} />
      <Route path="/community/reports/:id/edit" element={<LegacyAnimalReportRedirect />} />
      <Route path="/community/reports/:id" element={<LegacyAnimalReportRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;
