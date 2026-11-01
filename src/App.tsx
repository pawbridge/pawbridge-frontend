import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactElement } from 'react';
import { useAuthStore } from './store/authStore.ts';
import Home from './pages/Home.tsx';
import VisitTracker from './components/visits/VisitTracker';
import SiteLayout from './components/layout/SiteLayout';
import AdminLayout from './components/layout/AdminLayout';
import RequireLogin, { LoginRequiredCard } from './components/layout/RequireLogin';
import PageLoading from './components/common/PageLoading';

// 화면 코드는 처음 들어갈 때 따로 받아 온다(첫 화면 크기를 줄임). 홈은 가장 많이 들어오는 첫 화면이라 바로 싣는다.
// import() 경로는 고정 문자열로 둔다(빌드 도구가 화면별 파일을 미리 나눌 수 있게).
const Shelters = lazy(() => import('./pages/Shelters'));
const ShelterDetail = lazy(() => import('./pages/ShelterDetail'));
const AdminShelters = lazy(() => import('./pages/admin/AdminShelters'));
const AdminShelterDetail = lazy(() => import('./pages/admin/AdminShelterDetail'));
const AdminShelterApplications = lazy(() => import('./pages/admin/AdminShelterApplications'));
const AdminShelterApplicationDetail = lazy(() => import('./pages/admin/AdminShelterApplicationDetail'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Animals = lazy(() => import('./pages/Animals.tsx'));
const LostAnimalSearch = lazy(() => import('./pages/LostAnimalSearch.tsx'));
const AnimalDetail = lazy(() => import('./pages/AnimalDetail.tsx'));
const AnimalCreate = lazy(() => import('./pages/AnimalCreate.tsx'));
const AnimalEdit = lazy(() => import('./pages/AnimalEdit.tsx'));
const Products = lazy(() => import('./pages/Products.tsx'));
const ProductDetail = lazy(() => import('./pages/ProductDetail.tsx'));
const ProductCreate = lazy(() => import('./pages/admin/ProductCreate.tsx'));
const ProductEdit = lazy(() => import('./pages/admin/ProductEdit.tsx'));
const AdminProductList = lazy(() => import('./pages/admin/AdminProductList.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));
const AdminCategoryManagement = lazy(() => import('./pages/admin/AdminCategoryManagement.tsx'));
const AdminOptionGroupManagement = lazy(() => import('./pages/admin/AdminOptionGroupManagement.tsx'));
const Cart = lazy(() => import('./pages/Cart.tsx'));
const Checkout = lazy(() => import('./pages/Checkout.tsx'));
const OrderComplete = lazy(() => import('./pages/OrderComplete.tsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.tsx'));
const Orders = lazy(() => import('./pages/Orders.tsx'));
const OrderDetail = lazy(() => import('./pages/OrderDetail.tsx'));
const AdminOrderList = lazy(() => import('./pages/admin/AdminOrderList.tsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail.tsx'));
const AdminUserManagement = lazy(() => import('./pages/admin/AdminUserManagement.tsx'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail.tsx'));
const AdminPostManagement = lazy(() => import('./pages/admin/AdminPostManagement.tsx'));
const AdminPostDetail = lazy(() => import('./pages/admin/AdminPostDetail.tsx'));
const AdminStatistics = lazy(() => import('./pages/admin/AdminStatistics.tsx'));
const AdminVideoManagement = lazy(() => import('./pages/admin/AdminVideoManagement'));
const MyPage = lazy(() => import('./pages/MyPage.tsx'));
const FavoriteAnimals = lazy(() => import('./pages/FavoriteAnimals.tsx'));
const RegisteredAnimals = lazy(() => import('./pages/RegisteredAnimals.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));
const CommunityList = lazy(() => import('./pages/CommunityList.tsx'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail.tsx'));
const CommunityCreate = lazy(() => import('./pages/CommunityCreate.tsx'));
const AnimalReportForm = lazy(() => import('./pages/AnimalReportForm.tsx'));
const AnimalReportDetail = lazy(() => import('./pages/AnimalReportDetail.tsx'));
const AnimalReportList = lazy(() => import('./pages/AnimalReportList.tsx'));
const LegacyAnimalReportRedirect = lazy(() => import('./pages/LegacyAnimalReportRedirect.tsx'));
const CommunityEdit = lazy(() => import('./pages/CommunityEdit.tsx'));
const AdoptionList = lazy(() => import('./pages/AdoptionList.tsx'));
const AdoptionDetail = lazy(() => import('./pages/AdoptionDetail.tsx'));
const AdoptionCreate = lazy(() => import('./pages/AdoptionCreate.tsx'));
const AdoptionEdit = lazy(() => import('./pages/AdoptionEdit.tsx'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback.tsx'));
const AnimalStats = lazy(() => import('./pages/AnimalStats.tsx'));
const Travel = lazy(() => import('./pages/Travel.tsx'));
const TravelDetail = lazy(() => import('./pages/TravelDetail.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));
const Terms = lazy(() => import('./pages/Terms.tsx'));
const PrivateNotes = lazy(() => import('./pages/PrivateNotes'));
const PrivateNoteCompose = lazy(() => import('./pages/PrivateNoteCompose'));
const PrivateNoteDetail = lazy(() => import('./pages/PrivateNoteDetail'));
const PrivateNoteBlocks = lazy(() => import('./pages/PrivateNoteBlocks'));
const MemberChats = lazy(() => import('./pages/MemberChats'));

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
          <h1 className="text-xl font-bold text-text-light dark:text-text-dark">로그인이 필요합니다</h1>
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
          <h1 className="text-xl font-bold text-text-light dark:text-text-dark">접근 권한이 없습니다</h1>
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
    {/* 공통 틀 밖 화면(로그인, 동물 등록 등)을 받아 오는 동안. 틀 안 화면은 각 틀이 따로 기다린다. */}
    <Suspense fallback={<PageLoading fullScreen />}>
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
      {/* Password reset belonged to email login, which production no longer offers. */}
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />
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
    </Suspense>
    </>
  );
}

export default App;
