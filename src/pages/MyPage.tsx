import MyWishlistPanel, { type WishlistSortOption } from '../components/mypage/MyWishlistPanel';
import MyCartPanel from '../components/mypage/MyCartPanel';
import MyOrdersPanel from '../components/mypage/MyOrdersPanel';
import MyFavoriteAnimalsPanel from '../components/mypage/MyFavoriteAnimalsPanel';
import MyRegisteredAnimalsPanel from '../components/mypage/MyRegisteredAnimalsPanel';
import MyPageSidebar, { type MyPageTab } from '../components/mypage/MyPageSidebar';
import MyProfilePanel from '../components/mypage/MyProfilePanel';
import MyPasswordPanel from '../components/mypage/MyPasswordPanel';
import MyShelterApplications from '../components/shelter/MyShelterApplications';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyInfo, updateNickname, updatePassword, getFavoriteAnimals, getRegisteredAnimals } from '../api/user.api';
import { getWishlists, deleteWishlist, addToCart, getCart, clearCart } from '../api/products.api';
import { getOrders } from '../api/orders.api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { canSeePetMarket } from '../lib/petMarket';
import type { UpdateNicknameRequest, PasswordUpdateRequest, OrderStatus } from '../types/api.types';

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const showPetMarket = canSeePetMarket(user?.role);

  // location.state에서 탭 정보 가져오기 (뒤로가기 시)
  // sessionStorage도 확인하여 뒤로가기 시에도 탭 유지
  const [selectedTab, setActiveTab] = useState<MyPageTab>(() => {
    // 1. location.state에서 우선 확인
    if (location.state?.tab) {
      return location.state.tab as MyPageTab;
    }
    // 2. sessionStorage에서 확인 (뒤로가기 시)
    const savedTab = sessionStorage.getItem('mypageActiveTab');
    if (savedTab && ['shelter', 'profile', 'password', 'favoriteAnimals', 'registeredAnimals', 'wishlist', 'cart', 'orders'].includes(savedTab)) {
      return savedTab as MyPageTab;
    }
    // 3. 기본값
    return 'profile';
  });
  // A saved market tab must not render or fetch market data for a non-admin.
  const activeTab = !showPetMarket && ['wishlist', 'cart', 'orders'].includes(selectedTab)
    ? 'profile' : selectedTab;

  // location.state가 변경되면 탭 업데이트
  useEffect(() => {
    if (location.state?.tab) {
      const tab = location.state.tab as MyPageTab;
      setActiveTab(tab);
      // sessionStorage에 저장 (뒤로가기 대비)
      sessionStorage.setItem('mypageActiveTab', tab);
      // state 초기화 (뒤로가기 시 중복 적용 방지)
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // activeTab이 변경되면 sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('mypageActiveTab', activeTab);
  }, [activeTab]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [passwordData, setPasswordData] = useState<PasswordUpdateRequest>({
    currentPassword: '',
    newPassword: '',
  });

  // Favorite animals states
  const [favoriteAnimalsPage, setFavoriteAnimalsPage] = useState(0);

  // Wishlist states
  const [wishlistPage, setWishlistPage] = useState(0);
  const [selectedWishlistItems, setSelectedWishlistItems] = useState<number[]>([]);
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortOption, setSortOption] = useState<WishlistSortOption>('latest');

  // Orders states
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [ordersPage, setOrdersPage] = useState(0);

  // 내 정보 조회
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['myInfo', user?.id],
    queryFn: ({ signal }) => getMyInfo(signal),
    enabled: !!user?.id,
  });

  // 찜한 동물 목록 조회
  const { data: favoriteAnimals } = useQuery({
    queryKey: ['favoriteAnimals', user?.id],
    queryFn: ({ signal }) => getFavoriteAnimals(signal),
    enabled: !!user?.id && activeTab === 'favoriteAnimals',
  });

  // 등록한 동물 목록 조회 (보호소만)
  const [registeredPage, setRegisteredPage] = useState(0);
  const { data: registeredAnimals } = useQuery({
    queryKey: ['registeredAnimals', user?.id, registeredPage, 20],
    queryFn: ({ signal }) => getRegisteredAnimals(registeredPage, 20, signal),
    enabled: !!user?.id && activeTab === 'registeredAnimals' && userInfo?.role === 'ROLE_SHELTER',
  });

  // 위시리스트 조회
  const { data: wishlists } = useQuery({
    queryKey: ['wishlists', user?.id || 'mock', wishlistPage, 20],
    queryFn: () => getWishlists(user?.id || 1, { page: wishlistPage, size: 20 }),
    enabled: activeTab === 'wishlist',
  });

  // 장바구니 조회
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: ({ signal }) => getCart(signal),
    enabled: !!user?.id && activeTab === 'cart',
  });

  // 주문 내역 조회
  const { data: ordersData } = useQuery({
    queryKey: ['orders', user?.id || 'test', statusFilter, ordersPage],
    queryFn: () =>
      getOrders({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        page: ordersPage,
        size: 10,
      }),
    enabled: activeTab === 'orders',
  });

  // 닉네임 변경 mutation
  const updateNicknameMutation = useMutation({
    mutationFn: (data: UpdateNicknameRequest) => updateNickname(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInfo'] });
      alert('닉네임이 변경되었습니다.');
      setNicknameInput('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '닉네임 변경에 실패했습니다.');
    },
  });

  // 비밀번호 변경 mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordUpdateRequest) => updatePassword(data),
    onSuccess: () => {
      alert('비밀번호가 변경되었습니다.');
      setPasswordData({ currentPassword: '', newPassword: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    },
  });

  // 위시리스트 선택 삭제 mutation
  const deleteSelectedWishlistMutation = useMutation({
    mutationFn: async (wishlistIds: number[]) => {
      await Promise.all(wishlistIds.map(id => deleteWishlist(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      setSelectedWishlistItems([]);
      alert('선택한 상품이 삭제되었습니다.');
    },
    onError: () => {
      alert('삭제에 실패했습니다.');
    },
  });

  // 위시리스트 개별 삭제 mutation
  const deleteWishlistItemMutation = useMutation({
    mutationFn: deleteWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      alert('찜 목록에서 삭제되었습니다.');
    },
    onError: () => {
      alert('삭제에 실패했습니다.');
    },
  });

  // 장바구니 추가 mutation
  const addToCartMutation = useMutation({
    mutationFn: (skuId: number) => addToCart({ skuId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const goToCart = window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?');
      if (goToCart) {
        setActiveTab('cart');
      }
    },
    onError: () => {
      alert('장바구니 추가에 실패했습니다.');
    },
  });

  // 장바구니 비우기 mutation
  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 닉네임 변경 핸들러
  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    if (nicknameInput.length < 2 || nicknameInput.length > 30) {
      alert('닉네임은 2~30자여야 합니다.');
      return;
    }
    updateNicknameMutation.mutate({ nickname: nicknameInput });
  };

  // 비밀번호 변경 핸들러
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  // 위시리스트 정렬 및 필터링
  const filteredAndSortedWishlist = useMemo(() => {
    if (!wishlists?.content) return [];

    let items = [...wishlists.content];

    // 품절 상품 숨기기
    if (hideSoldOut) {
      items = items.filter(item => item.productStatus !== 'SOLD_OUT');
    }

    // 정렬
    switch (sortOption) {
      case 'latest':
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'priceAsc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        items.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
    }

    return items;
  }, [wishlists?.content, hideSoldOut, sortOption]);

  // 위시리스트 전체 선택/해제
  const handleSelectAllWishlist = (checked: boolean) => {
    if (checked) {
      setSelectedWishlistItems(filteredAndSortedWishlist.map(item => item.wishlistId));
    } else {
      setSelectedWishlistItems([]);
    }
  };

  // 위시리스트 개별 선택/해제
  const handleSelectWishlistItem = (wishlistId: number, checked: boolean) => {
    if (checked) {
      setSelectedWishlistItems(prev => [...prev, wishlistId]);
    } else {
      setSelectedWishlistItems(prev => prev.filter(id => id !== wishlistId));
    }
  };

  const handleDeleteSelectedWishlist = () => {
    if (selectedWishlistItems.length === 0) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }
    if (window.confirm(`선택한 ${selectedWishlistItems.length}개의 상품을 삭제하시겠습니까?`)) {
      deleteSelectedWishlistMutation.mutate(selectedWishlistItems);
    }
  };

  const handleDeleteWishlistItem = (wishlistId: number) => {
    if (window.confirm('찜 목록에서 삭제하시겠습니까?')) {
      deleteWishlistItemMutation.mutate(wishlistId);
    }
  };

  const handleOrderStatusChange = (status: OrderStatus | 'ALL') => {
    setStatusFilter(status);
    setOrdersPage(0);
  };

  // 장바구니 총 금액 계산
  const SHIPPING_FEE = 3000;
  const FREE_SHIPPING_THRESHOLD = 50000;
  const totalProductPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = totalProductPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalPrice = totalProductPrice + shippingFee;

  // 장바구니 비우기 핸들러
  const handleClearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      clearCartMutation.mutate();
    }
  };

  // 주문하기 핸들러
  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    navigate('/checkout', {
      state: {
        cartItems,
        totalProductPrice,
        shippingFee,
        totalPrice
      }
    });
  };

  // 권한 한글 변환
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_USER':
        return '일반 회원';
      case 'ROLE_ADMIN':
        return '관리자';
      case 'ROLE_SHELTER':
        return '보호소 회원';
      default:
        return role;
    }
  };

  // 가입 경로 한글 변환
  const getProviderLabel = (provider: string | null) => {
    switch (provider) {
      case 'LOCAL':
        return '이메일 가입';
      case 'GOOGLE':
        return '구글 가입';
      case 'KAKAO':
        return '카카오 가입';
      default:
        return '이메일 가입';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* 사이드바 */}
          <MyPageSidebar
            userInfo={userInfo}
            activeTab={activeTab}
            showPetMarket={showPetMarket}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />

          {/* 메인 콘텐츠 */}
          <div className="flex-1 md:w-3/4 lg:w-4/5">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                마이페이지
              </h1>
            </div>

            <div className="bg-white dark:bg-gray-800/20 p-6 sm:p-8 rounded-xl shadow-sm">
              {activeTab === 'shelter' && <MyShelterApplications key={user?.id} role={userInfo.role} />}
              {activeTab === 'profile' && (
                <MyProfilePanel
                  userInfo={userInfo}
                  providerLabel={getProviderLabel(userInfo.provider)}
                  roleLabel={getRoleLabel(userInfo.role)}
                  joinedAtLabel={formatDate(userInfo.createdAt)}
                  nickname={nicknameInput}
                  onNicknameChange={setNicknameInput}
                  onSubmit={handleNicknameSubmit}
                  isPending={updateNicknameMutation.isPending}
                />
              )}

              {activeTab === 'password' && (
                <MyPasswordPanel
                  provider={userInfo.provider}
                  providerLabel={getProviderLabel(userInfo.provider)}
                  value={passwordData}
                  onChange={setPasswordData}
                  onSubmit={handlePasswordSubmit}
                  isPending={updatePasswordMutation.isPending}
                />
              )}

              {activeTab === 'favoriteAnimals' && (
                <MyFavoriteAnimalsPanel
                  favoriteAnimals={favoriteAnimals}
                  currentPage={favoriteAnimalsPage}
                  onPageChange={setFavoriteAnimalsPage}
                />
              )}

              {activeTab === 'registeredAnimals' && (
                <MyRegisteredAnimalsPanel
                  registeredAnimals={registeredAnimals}
                  currentPage={registeredPage}
                  onPageChange={setRegisteredPage}
                />
              )}

              {activeTab === 'wishlist' && (
                <MyWishlistPanel
                  wishlists={wishlists}
                  filteredAndSortedWishlist={filteredAndSortedWishlist}
                  selectedWishlistItems={selectedWishlistItems}
                  hideSoldOut={hideSoldOut}
                  sortOption={sortOption}
                  wishlistPage={wishlistPage}
                  onSelectAll={handleSelectAllWishlist}
                  onSelectItem={handleSelectWishlistItem}
                  onHideSoldOutChange={setHideSoldOut}
                  onSortChange={setSortOption}
                  onPageChange={setWishlistPage}
                  onDeleteSelected={handleDeleteSelectedWishlist}
                  onDeleteItem={handleDeleteWishlistItem}
                  onAddToCart={(skuId) => addToCartMutation.mutate(skuId)}
                  isDeletingSelected={deleteSelectedWishlistMutation.isPending}
                  isDeletingItem={deleteWishlistItemMutation.isPending}
                  isAddingToCart={addToCartMutation.isPending}
                />
              )}

              {activeTab === 'cart' && (
                <MyCartPanel
                  cartItems={cartItems}
                  totalProductPrice={totalProductPrice}
                  shippingFee={shippingFee}
                  totalPrice={totalPrice}
                  freeShippingThreshold={FREE_SHIPPING_THRESHOLD}
                  onClearCart={handleClearCart}
                  onOrder={handleOrder}
                  isClearingCart={clearCartMutation.isPending}
                />
              )}

              {activeTab === 'orders' && (
                <MyOrdersPanel
                  ordersData={ordersData}
                  statusFilter={statusFilter}
                  ordersPage={ordersPage}
                  onStatusChange={handleOrderStatusChange}
                  onPageChange={setOrdersPage}
                  onOrderDetail={(orderId) => navigate(`/orders/${orderId}`)}
                />
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
