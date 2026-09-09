import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrderById, updateOrderStatus, updateDeliveryStatus } from '../api/orders.api';
import type { OrderStatus, DeliveryStatus } from '../types/api.types';
import { useAuthStore } from '../store/authStore';
import CustomSelect from '../components/common/CustomSelect';

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(false);

  // 주문 상세 조회
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => getAdminOrderById(Number(orderId)),
    enabled: !!orderId,
  });

  // 주문 상태 변경
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');
  const updateOrderStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(Number(orderId!), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error: any) => {
      alert(`주문 상태 변경 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 배송 상태 변경
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | ''>('');
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: (status: DeliveryStatus) => updateDeliveryStatus(Number(orderId!), { deliveryStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error: any) => {
      alert(`배송 상태 변경 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 상태 변경 핸들러
  const handleSaveChanges = async () => {
    if (!order) return;
    
    const changes: string[] = [];
    
    if (orderStatus && orderStatus !== order.status) {
      changes.push(`주문 상태: ${getStatusLabel(order.status)} → ${getStatusLabel(orderStatus)}`);
    }
    
    if (deliveryStatus && deliveryStatus !== order.deliveryStatus) {
      changes.push(`배송 상태: ${getDeliveryStatusLabel(order.deliveryStatus)} → ${getDeliveryStatusLabel(deliveryStatus)}`);
    }
    
    if (changes.length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }
    
    if (!window.confirm(`다음 변경사항을 저장하시겠습니까?\n\n${changes.join('\n')}`)) {
      return;
    }
    
    // 변경된 상태만 업데이트
    const promises: Promise<any>[] = [];
    
    if (orderStatus && orderStatus !== order.status) {
      promises.push(updateOrderStatusMutation.mutateAsync(orderStatus));
    }
    
    if (deliveryStatus && deliveryStatus !== order.deliveryStatus) {
      promises.push(updateDeliveryStatusMutation.mutateAsync(deliveryStatus));
    }
    
    try {
      await Promise.all(promises);
      alert('변경사항이 저장되었습니다.');
    } catch (error) {
      // 에러는 각 mutation의 onError에서 처리됨
    }
  };

  // 상태 초기화
  useEffect(() => {
    if (order) {
      setOrderStatus(order.status);
      setDeliveryStatus(order.deliveryStatus);
    }
  }, [order]);

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 금액 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 주문 상태 라벨
  const getStatusLabel = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      PENDING: '주문 대기',
      PAID: '결제 완료',
      COMPLETED: '구매 확정',
      CANCELLED: '주문 취소',
      FAILED: '결제 실패',
    };
    return statusMap[status] || status;
  };

  // 배송 상태 라벨
  const getDeliveryStatusLabel = (status: DeliveryStatus) => {
    const statusMap: Record<DeliveryStatus, string> = {
      READY: '배송 준비중',
      SHIPPING: '배송 중',
      DELIVERED: '배송 완료',
    };
    return statusMap[status] || status;
  };

  // 주문 상태 배지
  const getStatusBadge = (status: OrderStatus) => {
    const statusMap = {
      PENDING: {
        label: '주문 대기',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      PAID: {
        label: '결제 완료',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      COMPLETED: {
        label: '구매 확정',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      CANCELLED: {
        label: '주문 취소',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
      FAILED: {
        label: '결제 실패',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="bg-background-light text-[#111418] font-display antialiased">
        <div className="flex h-screen w-full overflow-hidden bg-background-light">
          <div className="flex-1 overflow-y-auto bg-background-light">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">주문 정보를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-background-light text-[#111418] font-display antialiased">
        <div className="flex h-screen w-full overflow-hidden bg-background-light">
          <div className="flex-1 overflow-y-auto bg-background-light">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-red-500 mb-4">주문 정보를 불러올 수 없습니다.</p>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const statusBadge = getStatusBadge(order.status);
  const totalItemsPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0; // 배송비는 API에 포함되지 않을 수 있음

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
        {/* 사이드바 */}
        <aside className="w-64 h-full flex flex-col bg-surface-light dark:bg-surface-dark border-r border-[#e5e7eb] dark:border-gray-700 flex-shrink-0 z-20 hidden md:flex">
          <div className="p-6 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-text-main">
              <span className="material-symbols-outlined text-[24px]">pets</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-text-main dark:text-white text-lg font-bold leading-tight">PawBridge</h1>
              <p className="text-text-secondary text-xs font-medium">관리자 콘솔</p>
            </div>
          </div>
          <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group"
            >
              <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                dashboard
              </span>
              <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">
                대시보드
              </span>
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/20 text-text-main dark:text-white group transition-colors"
            >
              <span className="material-symbols-outlined text-text-main dark:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                receipt_long
              </span>
              <span className="text-sm font-semibold">주문 관리</span>
            </Link>
            <div className="mt-2">
              <button
                onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                    inventory_2
                  </span>
                  <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">
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
                    className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm"
                    onClick={() => setIsProductMenuOpen(false)}
                  >
                    상품 목록
                  </Link>
                  <Link
                    to="/products/new"
                    className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm"
                    onClick={() => setIsProductMenuOpen(false)}
                  >
                    상품 등록
                  </Link>
                </div>
              )}
            </div>
            <div className="mt-2 mb-4">
              <button
                onClick={() => setIsOptionMenuOpen(!isOptionMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                    tune
                  </span>
                  <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">
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
                    className="pl-11 flex items-center gap-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors text-sm"
                    onClick={() => setIsOptionMenuOpen(false)}
                  >
                    옵션 그룹 관리
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/admin/categories"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors group"
            >
              <span className="material-symbols-outlined group-hover:text-text-main dark:group-hover:text-white transition-colors">
                category
              </span>
              <span className="text-sm font-medium group-hover:text-text-main dark:group-hover:text-white transition-colors">
                카테고리 관리
              </span>
            </Link>
          </nav>
          <div className="p-4 border-t border-[#e5e7eb] dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-text-sub dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">로그아웃</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
          {/* 헤더 */}
          <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-text-main dark:text-white">주문 상세</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center w-64 h-10 rounded-lg bg-background-light dark:bg-gray-800 px-3 border border-transparent focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-text-secondary">search</span>
                <input
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-text-main dark:text-white placeholder:text-text-secondary focus:ring-0"
                  placeholder="검색..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-text-main dark:text-white transition-colors relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                </button>
                <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div
                    className="size-8 rounded-full bg-cover bg-center border border-gray-200 bg-primary/20 flex items-center justify-center"
                  >
                    <div className="w-full h-full flex items-center justify-center text-text-main font-bold text-xs">
                      {user?.name?.charAt(0) || '관'}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-main dark:text-white hidden lg:block">
                    {user?.name || '관리자'}님
                  </span>
                  <span className="material-symbols-outlined text-text-secondary text-[18px] hidden lg:block">expand_more</span>
                </button>
              </div>
            </div>
          </header>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col">

            {/* Page Heading */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold tracking-tight">주문 상세 정보</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-normal">
                  주문 번호: <span className="font-medium text-text-main dark:text-white">{order.orderUuid}</span>
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-text-main dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-all h-10"
              >
                목록으로 돌아가기
              </button>
            </div>

            {/* Status Management Card */}
            <div className="mb-6 rounded-xl bg-white dark:bg-gray-800 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-[#e5e7eb] dark:border-gray-700">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-sm font-medium text-[#374151] dark:text-gray-200">주문 상태</span>
                    <CustomSelect
                      value={orderStatus}
                      onChange={(value) => setOrderStatus(value as OrderStatus)}
                      options={[
                        { value: 'PENDING', label: '주문 대기' },
                        { value: 'PAID', label: '결제 완료' },
                        { value: 'COMPLETED', label: '구매 확정' },
                        { value: 'CANCELLED', label: '주문 취소' },
                        { value: 'FAILED', label: '결제 실패' },
                      ]}
                      placeholder="주문 상태 선택"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-sm font-medium text-[#374151] dark:text-gray-200">배송 상태</span>
                    <CustomSelect
                      value={deliveryStatus}
                      onChange={(value) => setDeliveryStatus(value as DeliveryStatus)}
                      options={[
                        { value: 'READY', label: '배송 준비중' },
                        { value: 'SHIPPING', label: '배송 중' },
                        { value: 'DELIVERED', label: '배송 완료' },
                      ]}
                      placeholder="배송 상태 선택"
                    />
                  </label>
                </div>
                <button
                  onClick={handleSaveChanges}
                  disabled={
                    updateOrderStatusMutation.isPending ||
                    updateDeliveryStatusMutation.isPending ||
                    (orderStatus === order.status && deliveryStatus === order.deliveryStatus)
                  }
                  className="flex items-center justify-center rounded-lg bg-primary hover:bg-blue-500 text-white px-6 py-2.5 text-sm font-bold shadow-sm transition-all h-[42px] mt-4 md:mt-0 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">save</span>
                  변경 사항 저장
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Order Info */}
              <div className="rounded-xl bg-white dark:bg-gray-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-[#e5e7eb] dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f3f4f6] dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6b7280] dark:text-gray-400 text-[20px]">receipt_long</span>
                    주문 기본 정보
                  </h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">주문 번호</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{order.orderUuid}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">주문자 ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary">{order.userId}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">주문 상태</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{getStatusLabel(order.status)}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">배송 상태</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{getDeliveryStatusLabel(order.deliveryStatus)}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">주문 일시</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="rounded-xl bg-white dark:bg-gray-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-[#e5e7eb] dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f3f4f6] dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6b7280] dark:text-gray-400 text-[20px]">local_shipping</span>
                    배송 정보
                  </h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">수령인</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{order.receiverName}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400">전화번호</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white">{order.receiverPhone}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] items-start gap-2">
                    <span className="text-sm text-[#6b7280] dark:text-gray-400 mt-0.5">배송 주소</span>
                    <span className="text-sm font-medium text-[#111418] dark:text-white break-keep leading-relaxed">
                      {order.deliveryAddress}
                    </span>
                  </div>
                  {order.deliveryMessage && (
                    <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                      <span className="text-sm text-[#6b7280] dark:text-gray-400">배송 메시지</span>
                      <span className="text-sm font-normal text-[#111418] dark:text-white">{order.deliveryMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-xl bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-[#e5e7eb] overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-[#f3f4f6] flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6b7280] text-[20px]">shopping_bag</span>
                  주문 상품 ({order.items.length}개)
                </h3>
              </div>
              <div className="divide-y divide-[#f3f4f6]">
                {order.items.map((item, index) => (
                  <div key={index} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-gray-100"></div>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex justify-between">
                        <h3 className="text-base font-bold text-[#111418]">{item.productName}</h3>
                        <p className="text-base font-bold text-[#111418] sm:hidden">{formatPrice(item.price)}원</p>
                      </div>
                      <p className="text-sm text-[#6b7280]">SKU: {item.skuCode}</p>
                      <p className="text-sm text-[#111418] mt-1">수량: {item.quantity}개</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <p className="text-lg font-bold text-[#111418]">{formatPrice(item.price * item.quantity)}원</p>
                      <p className="text-sm text-[#6b7280]">{formatPrice(item.price)}원 / 개</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-xl bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-[#e5e7eb] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#f3f4f6] flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-[#111418] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6b7280] text-[20px]">payments</span>
                  결제 정보
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6b7280]">상품 금액</span>
                  <span className="text-sm font-medium text-[#111418]">{formatPrice(totalItemsPrice)}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6b7280]">배송비</span>
                  <span className="text-sm font-medium text-[#111418]">{formatPrice(shippingFee)}원</span>
                </div>
                <div className="border-t border-[#f3f4f6] pt-4 flex justify-between">
                  <span className="text-lg font-bold text-[#111418]">총 결제 금액</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}원</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
  );
}

