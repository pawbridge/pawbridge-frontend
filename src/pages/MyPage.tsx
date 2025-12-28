import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getMyInfo, updateNickname, updatePassword, getFavoriteAnimals, getRegisteredAnimals } from '../api/user.api';
import { getWishlists, deleteWishlist, addToCart, getCart, clearCart } from '../api/products.api';
import { getOrders } from '../api/orders.api';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';
import type { UpdateNicknameRequest, PasswordUpdateRequest, ProductStatus, OrderStatus } from '../types/api.types';

type TabType = 'profile' | 'password' | 'favoriteAnimals' | 'registeredAnimals' | 'wishlist' | 'cart' | 'orders';

export default function MyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [nicknameInput, setNicknameInput] = useState('');
  const [passwordData, setPasswordData] = useState<PasswordUpdateRequest>({
    currentPassword: '',
    newPassword: '',
  });

  // Favorite animals states
  const [favoriteAnimalsPage, setFavoriteAnimalsPage] = useState(0);
  const favoriteAnimalsPageSize = 12;

  // Wishlist states
  type SortOption = 'latest' | 'priceAsc' | 'priceDesc' | 'nameAsc';
  const [wishlistPage, setWishlistPage] = useState(0);
  const [selectedWishlistItems, setSelectedWishlistItems] = useState<number[]>([]);
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');

  // Orders states
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [ordersPage, setOrdersPage] = useState(0);

  // 내 정보 조회
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfo,
  });

  // 찜한 동물 목록 조회
  const { data: favoriteAnimals } = useQuery({
    queryKey: ['favoriteAnimals'],
    queryFn: getFavoriteAnimals,
    enabled: activeTab === 'favoriteAnimals',
  });

  // 등록한 동물 목록 조회 (보호소만)
  const [registeredPage, setRegisteredPage] = useState(0);
  const { data: registeredAnimals } = useQuery({
    queryKey: ['registeredAnimals', registeredPage],
    queryFn: () => getRegisteredAnimals(registeredPage, 20),
    enabled: activeTab === 'registeredAnimals' && userInfo?.role === 'ROLE_SHELTER',
  });

  // 위시리스트 조회
  const { data: wishlists } = useQuery({
    queryKey: ['wishlists', user?.id || 'mock', wishlistPage, 20],
    queryFn: () => getWishlists(user?.id || 1, { page: wishlistPage, size: 20 }),
    enabled: activeTab === 'wishlist',
  });

  // 장바구니 조회
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: activeTab === 'cart',
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

  // 찜한 동물 클라이언트 사이드 페이지네이션
  const paginatedFavoriteAnimals = useMemo(() => {
    if (!favoriteAnimals?.favorites) return { items: [], totalPages: 0 };

    const startIndex = favoriteAnimalsPage * favoriteAnimalsPageSize;
    const endIndex = startIndex + favoriteAnimalsPageSize;
    const items = favoriteAnimals.favorites.slice(startIndex, endIndex);
    const totalPages = Math.ceil(favoriteAnimals.favorites.length / favoriteAnimalsPageSize);

    return { items, totalPages };
  }, [favoriteAnimals?.favorites, favoriteAnimalsPage, favoriteAnimalsPageSize]);

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

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 상품 상태 배지
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { text: '판매중', className: 'bg-green-50 text-green-700 ring-green-600/20' };
      case 'SOLD_OUT':
        return { text: '품절', className: 'bg-gray-600 text-white ring-gray-600/20' };
      case 'HIDDEN':
        return { text: '숨김', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' };
      case 'DELETED':
        return { text: '삭제됨', className: 'bg-red-50 text-red-600 ring-red-600/20' };
      default:
        return { text: '알 수 없음', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' };
    }
  };

  // 주문 상태 배지
  const getOrderStatusBadge = (status: OrderStatus) => {
    const statusMap = {
      PENDING: {
        label: '주문 대기',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      PAID: {
        label: '결제 완료',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      COMPLETED: {
        label: '주문 완료',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      CANCELLED: {
        label: '주문 취소',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      FAILED: {
        label: '결제 실패',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    };
    return statusMap[status] || statusMap.PENDING;
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
          <aside className="md:w-1/4 lg:w-1/5">
            <div className="flex flex-col gap-6 p-4 bg-white dark:bg-gray-800/20 rounded-xl shadow-sm sticky top-24">
              {/* 프로필 정보 */}
              <div className="flex gap-4 items-center pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-text-main dark:text-gray-100 text-base font-bold leading-normal">
                    {userInfo.name}
                  </h1>
                  <p className="text-primary dark:text-green-300 text-sm font-normal leading-normal">
                    {userInfo.email}
                  </p>
                </div>
              </div>

              {/* 메뉴 */}
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'profile' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    person
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'profile'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    프로필 정보
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('favoriteAnimals')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'favoriteAnimals'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'favoriteAnimals' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'favoriteAnimals' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    pets
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'favoriteAnimals'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    내가 찜한 동물
                  </p>
                </button>

                {userInfo.role === 'ROLE_SHELTER' && (
                  <button
                    onClick={() => setActiveTab('registeredAnimals')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === 'registeredAnimals'
                        ? 'bg-primary/20 dark:bg-primary/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        activeTab === 'registeredAnimals' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      style={{ fontVariationSettings: activeTab === 'registeredAnimals' ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      home
                    </span>
                    <p
                      className={`text-sm ${
                        activeTab === 'registeredAnimals'
                          ? 'text-text-main dark:text-gray-100 font-bold'
                          : 'text-gray-500 dark:text-gray-400 font-medium'
                      }`}
                    >
                      내 보호소가 등록한 동물
                    </p>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'wishlist'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'wishlist' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'wishlist' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'wishlist'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    나의 위시리스트
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('cart')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'cart'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'cart' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'cart' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    shopping_cart
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'cart'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    나의 장바구니
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'orders' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    style={{ fontVariationSettings: activeTab === 'orders' ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    receipt_long
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'orders'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    나의 주문 목록
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === 'password'
                      ? 'bg-primary/20 dark:bg-primary/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      activeTab === 'password' ? 'text-text-main dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    lock_reset
                  </span>
                  <p
                    className={`text-sm ${
                      activeTab === 'password'
                        ? 'text-text-main dark:text-gray-100 font-bold'
                        : 'text-gray-500 dark:text-gray-400 font-medium'
                    }`}
                  >
                    비밀번호 변경
                  </p>
                </button>
              </nav>

              {/* 로그아웃 */}
              <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <span className="material-symbols-outlined text-red-500">logout</span>
                  <p className="text-red-500 text-sm font-medium leading-normal">로그아웃</p>
                </button>
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 md:w-3/4 lg:w-4/5">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                마이페이지
              </h1>
            </div>

            <div className="bg-white dark:bg-gray-800/20 p-6 sm:p-8 rounded-xl shadow-sm">
              {activeTab === 'profile' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    프로필 정보
                  </h2>

                  <div className="mt-8 space-y-6">
                    {/* 기본 정보 (읽기 전용) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          이메일 주소
                        </label>
                        <input
                          type="email"
                          value={userInfo.email}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                        <input
                          type="text"
                          value={userInfo.name}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          닉네임
                        </label>
                        <input
                          type="text"
                          value={userInfo.nickname || '미설정'}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          가입 경로
                        </label>
                        <input
                          type="text"
                          value={getProviderLabel(userInfo.provider)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">권한</label>
                        <input
                          type="text"
                          value={getRoleLabel(userInfo.role)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          가입일시
                        </label>
                        <input
                          type="text"
                          value={formatDate(userInfo.createdAt)}
                          readOnly
                          className="w-full rounded-lg bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-default focus:border-gray-200 focus:ring-0"
                        />
                      </div>
                    </div>

                    {/* 닉네임 변경 폼 */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">닉네임 변경</h3>
                      <form onSubmit={handleNicknameSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            새 닉네임
                          </label>
                          <input
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder="2~30자의 한글, 영문, 숫자"
                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            한글, 영문, 숫자를 사용할 수 있으며 띄어쓰기가 불가능합니다.
                          </p>
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setNicknameInput('')}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-text-main dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={updateNicknameMutation.isPending}
                            className="px-6 py-2 bg-primary text-text-main rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
                          >
                            {updateNicknameMutation.isPending ? '변경 중...' : '변경하기'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    비밀번호 변경
                  </h2>

                  {userInfo.provider !== 'LOCAL' && userInfo.provider !== null ? (
                    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        {getProviderLabel(userInfo.provider)} 계정은 비밀번호를 변경할 수 없습니다.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          현재 비밀번호
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          새 비밀번호
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-primary focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          8~20자의 영문, 숫자, 특수문자를 포함해야 합니다.
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setPasswordData({ currentPassword: '', newPassword: '' })}
                          className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-text-main dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                          className="px-6 py-2 bg-primary text-text-main rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
                        >
                          {updatePasswordMutation.isPending ? '변경 중...' : '변경하기'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {activeTab === 'favoriteAnimals' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    내가 찜한 동물
                  </h2>

                  {favoriteAnimals && favoriteAnimals.totalCount > 0 ? (
                    <div className="mt-8 space-y-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        총 {favoriteAnimals.totalCount}마리의 동물을 찜했습니다
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedFavoriteAnimals.items.map((favorite) => (
                          <Link
                            key={favorite.favoriteId}
                            to={`/animals/${favorite.animalId}`}
                            className="block bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                          >
                            {favorite.imageUrl ? (
                              <img src={favorite.imageUrl} alt={favorite.breed || '동물'} className="w-full h-48 object-cover" />
                            ) : (
                              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-gray-400">pets</span>
                              </div>
                            )}
                            <div className="p-4">
                              <h3 className="font-bold text-text-main dark:text-white mb-2">{favorite.breed || '품종 정보 없음'}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {favorite.species || '종 정보 없음'} • {favorite.gender || '성별 정보 없음'} • {favorite.age ? `${favorite.age}세` : '나이 정보 없음'}
                              </p>
                              {favorite.shelterName && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">location_on</span>
                                  {favorite.shelterName}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* 페이지네이션 */}
                      {paginatedFavoriteAnimals.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setFavoriteAnimalsPage((prev) => Math.max(0, prev - 1))}
                            disabled={favoriteAnimalsPage === 0}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            이전
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: paginatedFavoriteAnimals.totalPages }, (_, i) => i).map((page) => (
                              <button
                                key={page}
                                onClick={() => setFavoriteAnimalsPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  favoriteAnimalsPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setFavoriteAnimalsPage((prev) => Math.min(paginatedFavoriteAnimals.totalPages - 1, prev + 1))}
                            disabled={favoriteAnimalsPage >= paginatedFavoriteAnimals.totalPages - 1}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">pets</span>
                      <p className="text-gray-500 dark:text-gray-400">아직 찜한 동물이 없습니다.</p>
                      <Link to="/animals" className="inline-block mt-4 px-6 py-2 bg-primary text-text-main rounded-lg hover:bg-green-400 transition-colors">
                        동물 둘러보기
                      </Link>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'registeredAnimals' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    내 보호소가 등록한 동물
                  </h2>

                  {registeredAnimals && registeredAnimals.content.length > 0 ? (
                    <div className="mt-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        총 {registeredAnimals.totalElements}마리의 동물을 등록했습니다
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {registeredAnimals.content.map((animal) => (
                          <Link
                            key={animal.id}
                            to={`/animals/${animal.id}`}
                            className="block bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                          >
                            {animal.imageUrl ? (
                              <img src={animal.imageUrl} alt={animal.breed || '동물'} className="w-full h-48 object-cover" />
                            ) : (
                              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-gray-400">pets</span>
                              </div>
                            )}
                            <div className="p-4">
                              <h3 className="font-bold text-text-main dark:text-white mb-2">{animal.breed || '품종 정보 없음'}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {animal.species || '종 정보 없음'} • {animal.gender || '성별 정보 없음'} • {animal.age ? `${animal.age}세` : '나이 정보 없음'}
                              </p>
                              {animal.status && (
                                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                                  animal.status === 'PROTECT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {animal.status === 'PROTECT' ? '보호중' : animal.status}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* 페이지네이션 */}
                      {registeredAnimals && registeredAnimals.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setRegisteredPage((prev) => Math.max(0, prev - 1))}
                            disabled={registeredPage === 0}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            이전
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: registeredAnimals.totalPages }, (_, i) => i).map((page) => (
                              <button
                                key={page}
                                onClick={() => setRegisteredPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  registeredPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setRegisteredPage((prev) => Math.min(registeredAnimals.totalPages - 1, prev + 1))}
                            disabled={registeredPage >= registeredAnimals.totalPages - 1}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">pets</span>
                      <p className="text-gray-500 dark:text-gray-400">아직 등록한 동물이 없습니다.</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'wishlist' && (
                <>
                  <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
                    나의 위시리스트
                  </h2>

                  {wishlists && wishlists.content.length > 0 ? (
                    <div className="mt-8 space-y-6">
                      {/* 필터 및 정렬 */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <label className="flex items-center gap-2 cursor-pointer group select-none">
                            <input
                              type="checkbox"
                              checked={filteredAndSortedWishlist.length > 0 && selectedWishlistItems.length === filteredAndSortedWishlist.length}
                              onChange={(e) => handleSelectAllWishlist(e.target.checked)}
                              className="rounded text-primary border-gray-300 focus:ring-primary h-5 w-5"
                            />
                            <span className="text-sm font-medium text-text-light dark:text-text-dark group-hover:text-primary transition-colors">
                              전체 선택 ({selectedWishlistItems.length})
                            </span>
                          </label>
                          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                          <button
                            onClick={() => {
                              if (selectedWishlistItems.length === 0) {
                                alert('삭제할 상품을 선택해주세요.');
                                return;
                              }
                              if (window.confirm(`선택한 ${selectedWishlistItems.length}개의 상품을 삭제하시겠습니까?`)) {
                                deleteSelectedWishlistMutation.mutate(selectedWishlistItems);
                              }
                            }}
                            disabled={deleteSelectedWishlistMutation.isPending || selectedWishlistItems.length === 0}
                            className="text-sm font-medium text-subtext-light hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            선택 삭제
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-subtext-light hover:text-text-light dark:hover:text-text-dark transition-colors">
                            <input
                              type="checkbox"
                              checked={hideSoldOut}
                              onChange={(e) => setHideSoldOut(e.target.checked)}
                              className="rounded text-primary border-gray-300 focus:ring-primary h-4 w-4"
                            />
                            <span>품절 상품 숨기기</span>
                          </label>
                          <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:border-primary focus:ring-primary py-2 pl-3 pr-8 cursor-pointer"
                          >
                            <option value="latest">최신순</option>
                            <option value="priceAsc">가격 낮은순</option>
                            <option value="priceDesc">가격 높은순</option>
                            <option value="nameAsc">상품명순</option>
                          </select>
                        </div>
                      </div>

                      {/* 상품 목록 */}
                      {filteredAndSortedWishlist.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">표시할 상품이 없습니다.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredAndSortedWishlist.map((item) => {
                            const statusBadge = getStatusBadge(item.productStatus);
                            const isSoldOut = item.productStatus === 'SOLD_OUT';
                            const isSelected = selectedWishlistItems.includes(item.wishlistId);

                            return (
                              <div
                                key={item.wishlistId}
                                className={`group flex gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-4 ${
                                  isSoldOut ? 'opacity-75' : ''
                                }`}
                              >
                                {/* 체크박스 + 이미지 */}
                                <div className="relative flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => handleSelectWishlistItem(item.wishlistId, e.target.checked)}
                                    className="absolute top-2 left-2 z-10 rounded-md text-primary border-white bg-white/80 h-5 w-5 shadow-sm cursor-pointer hover:bg-white focus:ring-primary focus:ring-offset-0"
                                  />
                                  <Link to={`/products/${item.productId}`}>
                                    <img
                                      alt={item.productName}
                                      src={item.productImageUrl || placeholderImg}
                                      className="w-32 h-32 object-cover rounded-lg"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = placeholderImg;
                                      }}
                                    />
                                  </Link>
                                  <span className={`absolute bottom-2 right-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset ${statusBadge.className}`}>
                                    {statusBadge.text}
                                  </span>
                                </div>

                                {/* 상품 정보 */}
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                  <div>
                                    {item.categoryName && (
                                      <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">
                                        {item.categoryName}
                                      </p>
                                    )}
                                    <Link to={`/products/${item.productId}`}>
                                      <h3 className="text-base font-bold text-text-light dark:text-text-dark hover:text-primary transition-colors line-clamp-2">
                                        {item.productName}
                                      </h3>
                                    </Link>
                                    {Object.keys(item.options).length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {Object.entries(item.options).map(([key, value]) => (
                                          <span
                                            key={`${key}-${value}`}
                                            className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                                          >
                                            {key}: {value}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-lg font-bold text-text-light dark:text-text-dark mt-2">
                                      {item.price.toLocaleString()}
                                      <span className="text-sm font-normal ml-0.5">원</span>
                                    </p>
                                  </div>

                                  {/* 버튼 */}
                                  <div className="flex items-center gap-2 mt-3">
                                    <button
                                      onClick={() => addToCartMutation.mutate(item.skuId)}
                                      disabled={isSoldOut || addToCartMutation.isPending}
                                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary py-2 px-3 text-sm font-bold text-white hover:bg-primary-hover transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                      {isSoldOut ? (
                                        <>
                                          <span className="material-symbols-outlined text-[16px]">block</span>
                                          품절
                                        </>
                                      ) : (
                                        <>
                                          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                                          담기
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('찜 목록에서 삭제하시겠습니까?')) {
                                          deleteWishlistItemMutation.mutate(item.wishlistId);
                                        }
                                      }}
                                      disabled={deleteWishlistItemMutation.isPending}
                                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-subtext-light hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                      title="삭제"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 페이지네이션 */}
                      {wishlists && wishlists.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setWishlistPage((prev) => Math.max(0, prev - 1))}
                            disabled={wishlistPage === 0}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            이전
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: wishlists.totalPages }, (_, i) => i).map((page) => (
                              <button
                                key={page}
                                onClick={() => setWishlistPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  wishlistPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setWishlistPage((prev) => Math.min(wishlists.totalPages - 1, prev + 1))}
                            disabled={wishlistPage >= wishlists.totalPages - 1}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">favorite_border</span>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">찜한 상품이 없습니다.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">마음에 드는 상품을 찾아 위시리스트에 담아보세요.</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                      >
                        쇼핑하러 가기
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'cart' && (
                <>
                  <div className="flex justify-between items-center pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                      나의 장바구니
                    </h2>
                    {cartItems.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                        disabled={clearCartMutation.isPending}
                      >
                        장바구니 비우기
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">shopping_cart_off</span>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">장바구니가 비어있습니다.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">마음에 드는 상품을 담아보세요.</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                      >
                        쇼핑 계속하기
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-8 space-y-6">
                      {/* 상품 목록 */}
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div
                            key={item.skuId}
                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            {/* 상품 이미지 */}
                            <div
                              className="w-20 h-20 rounded-md bg-cover bg-center flex-shrink-0 bg-gray-100"
                              style={{ backgroundImage: item.productImageUrl ? `url('${item.productImageUrl}')` : undefined }}
                            >
                              {!item.productImageUrl && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="material-symbols-outlined text-2xl text-gray-400">image</span>
                                </div>
                              )}
                            </div>

                            {/* 상품 정보 */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-text-light dark:text-text-dark truncate">{item.productName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.skuCode}</p>
                              <div className="mt-2 flex items-center gap-4 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">단가: ₩{formatPrice(item.price)}</span>
                                <span className="text-gray-500 dark:text-gray-400">수량: {item.quantity}</span>
                              </div>
                            </div>

                            {/* 소계 */}
                            <div className="text-right">
                              <p className="font-bold text-text-light dark:text-text-dark">
                                ₩{formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 주문 요약 */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4">주문 요약</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">총 상품 금액</p>
                            <p className="text-text-light dark:text-text-dark text-sm">₩{formatPrice(totalProductPrice)}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">배송비</p>
                            <p className="text-text-light dark:text-text-dark text-sm">
                              {shippingFee === 0 ? '무료' : `₩${formatPrice(shippingFee)}`}
                            </p>
                          </div>
                          {totalProductPrice < FREE_SHIPPING_THRESHOLD && (
                            <p className="text-xs text-primary">
                              ₩{formatPrice(FREE_SHIPPING_THRESHOLD - totalProductPrice)} 더 구매 시 무료배송!
                            </p>
                          )}
                          <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                          <div className="flex justify-between items-center">
                            <p className="text-text-light dark:text-text-dark text-base font-bold">총 결제 예정 금액</p>
                            <p className="text-primary text-xl font-bold">₩{formatPrice(totalPrice)}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleOrder}
                          className="w-full mt-6 flex items-center justify-center rounded-lg h-12 bg-primary text-white text-base font-bold hover:bg-primary-hover transition-colors"
                        >
                          주문하기
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'orders' && (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                      나의 주문 목록
                    </h2>
                    <div className="min-w-[200px]">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value as OrderStatus | 'ALL');
                          setOrdersPage(0);
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="ALL">전체 상태</option>
                        <option value="PENDING">주문 대기</option>
                        <option value="PAID">결제 완료</option>
                        <option value="COMPLETED">주문 완료</option>
                        <option value="CANCELLED">주문 취소</option>
                      </select>
                    </div>
                  </div>

                  {ordersData && ordersData.content.length > 0 ? (
                    <div className="mt-8 space-y-6">
                      {/* 주문 목록 */}
                      <div className="space-y-4">
                        {ordersData.content.map((order) => {
                          const firstItem = order.items[0];
                          const statusBadge = getOrderStatusBadge(order.status);
                          return (
                            <div
                              key={order.orderId}
                              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                            >
                              <div className="flex flex-col md:flex-row gap-4">
                                {/* 상품 정보 */}
                                <div className="flex gap-4 flex-1">
                                  <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
                                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <h3 className="font-bold text-text-light dark:text-text-dark line-clamp-2">
                                      {firstItem.productName}
                                      {order.items.length > 1 && ` 외 ${order.items.length - 1}개`}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {firstItem.skuCode}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      수량: {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
                                    </p>
                                  </div>
                                </div>

                                {/* 주문 정보 */}
                                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">주문일자</p>
                                    <p className="text-sm text-text-light dark:text-text-dark">
                                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      No. {order.orderUuid.slice(0, 13)}
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">결제 금액</p>
                                    <p className="text-base font-bold text-text-light dark:text-text-dark">
                                      {formatPrice(order.totalAmount)}원
                                    </p>
                                  </div>

                                  <div className="flex flex-col gap-2 items-start md:items-center">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}
                                    >
                                      {statusBadge.label}
                                    </span>
                                    <button
                                      onClick={() => navigate(`/orders/${order.orderId}`)}
                                      className="text-sm text-primary hover:underline font-medium"
                                    >
                                      상세 보기
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 배송 정보 (간략) */}
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                <p>수령인: {order.receiverName}</p>
                                <p className="truncate">주소: {order.deliveryAddress}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 페이지네이션 */}
                      {ordersData.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => setOrdersPage((prev) => Math.max(0, prev - 1))}
                            disabled={ordersPage === 0}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            이전
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: ordersData.totalPages }, (_, i) => i).map((page) => (
                              <button
                                key={page}
                                onClick={() => setOrdersPage(page)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  ordersPage === page
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setOrdersPage((prev) => Math.min(ordersData.totalPages - 1, prev + 1))}
                            disabled={ordersPage >= ordersData.totalPages - 1}
                            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">receipt_long</span>
                      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">주문 내역이 없습니다.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">상품을 주문하고 주문 내역을 확인해보세요.</p>
                      <Link
                        to="/products"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                      >
                        쇼핑하러 가기
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
