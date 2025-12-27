import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '../api/orders.api';
import type { OrderStatus, DeliveryStatus } from '../types/api.types';
import { useAuthStore } from '../store/authStore';

export default function AdminOrderList() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(false);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<DeliveryStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 주문 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', searchKeyword, statusFilter, deliveryStatusFilter, sortBy, sortOrder, currentPage],
    queryFn: () =>
      getAdminOrders({
        ...(searchKeyword && { keyword: searchKeyword }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(deliveryStatusFilter !== 'ALL' && { deliveryStatus: deliveryStatusFilter }),
        sortBy,
        sortOrder,
        page: currentPage,
        size: pageSize,
      }),
  });

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 금액 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
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

  // 배송 상태 배지
  const getDeliveryStatusBadge = (status: DeliveryStatus) => {
    const statusMap = {
      READY: {
        label: '배송 준비',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      SHIPPING: {
        label: '배송 중',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      DELIVERED: {
        label: '배송 완료',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
    };
    return statusMap[status] || statusMap.READY;
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchKeyword('');
    setStatusFilter('ALL');
    setDeliveryStatusFilter('ALL');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(0);
  };

  // 주문 상세 페이지로 이동
  const handleViewDetail = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <h2 className="text-xl font-bold text-text-main dark:text-white">주문 관리</h2>
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
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#0d151c] dark:text-white mb-1">
                    주문 관리
                  </h1>
                  <p className="text-[#49749c] dark:text-gray-400 text-sm md:text-base">
                    모든 주문 내역을 조회하고 관리합니다.
                  </p>
                </div>
              </div>
            </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e7edf4] dark:border-gray-800 p-4 shadow-sm flex flex-col gap-4">
        {/* Search Bar */}
        <div className="w-full">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">
                search
              </span>
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="주문번호 또는 수령인 이름으로 검색"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-[#f5f7f8] dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Order Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | 'ALL');
                setCurrentPage(0);
              }}
              className="flex items-center gap-2 px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors text-sm text-gray-700 dark:text-gray-200 appearance-none cursor-pointer"
              style={{ 
                WebkitAppearance: 'none', 
                MozAppearance: 'none',
                appearance: 'none',
                backgroundImage: 'none'
              }}
            >
              <option value="ALL">주문 상태</option>
              <option value="PENDING">주문 대기</option>
              <option value="PAID">결제 완료</option>
              <option value="COMPLETED">구매 확정</option>
              <option value="CANCELLED">주문 취소</option>
              <option value="FAILED">결제 실패</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-[20px] z-10">
              expand_more
            </span>
          </div>

          {/* Delivery Status Filter */}
          <div className="relative">
            <select
              value={deliveryStatusFilter}
              onChange={(e) => {
                setDeliveryStatusFilter(e.target.value as DeliveryStatus | 'ALL');
                setCurrentPage(0);
              }}
              className="flex items-center gap-2 px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors text-sm text-gray-700 dark:text-gray-200 appearance-none cursor-pointer"
              style={{ 
                WebkitAppearance: 'none', 
                MozAppearance: 'none',
                appearance: 'none',
                backgroundImage: 'none'
              }}
            >
              <option value="ALL">배송 상태</option>
              <option value="READY">배송 준비</option>
              <option value="SHIPPING">배송 중</option>
              <option value="DELIVERED">배송 완료</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-[20px] z-10">
              expand_more
            </span>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

          {/* Sort */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(by);
                setSortOrder(order);
                setCurrentPage(0);
              }}
              className="flex items-center gap-2 px-3 py-2 pr-10 bg-[#f5f7f8] dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors appearance-none cursor-pointer"
              style={{ 
                WebkitAppearance: 'none', 
                MozAppearance: 'none',
                appearance: 'none',
                backgroundImage: 'none'
              }}
            >
              <option value="createdAt-desc">최신순</option>
              <option value="createdAt-asc">과거순</option>
              <option value="totalAmount-desc">금액 높은순</option>
              <option value="totalAmount-asc">금액 낮은순</option>
              <option value="status-asc">상태순</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-[20px] z-10">
              expand_more
            </span>
          </div>

          <div className="flex-1"></div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary transition-colors text-sm text-gray-700 dark:text-gray-200 font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            필터 초기화
          </button>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#1a2632] border border-[#e7edf4] dark:border-gray-800 rounded-xl shadow-sm p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">주문 목록을 불러오는 중...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#1a2632] border border-[#e7edf4] dark:border-gray-800 rounded-xl shadow-sm p-12">
          <div className="text-center">
            <p className="text-red-500 mb-4">주문 목록을 불러오는 중 오류가 발생했습니다.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-[#1a2632] border border-[#e7edf4] dark:border-gray-800 rounded-xl shadow-sm p-12">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
              receipt_long
            </span>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">주문이 없습니다</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#1a2632] border border-[#e7edf4] dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-center">
                      ID
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      주문번호
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      주문일시
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      주문자 / 수령인
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      주문 상태
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      배송 상태
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      총 결제금액
                    </th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {orders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const deliveryStatusBadge = getDeliveryStatusBadge(order.deliveryStatus);
                    return (
                      <tr
                        key={order.orderId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <td className="py-4 px-6 text-sm text-gray-500 text-center">{order.orderId}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.orderUuid.slice(0, 20)}...
                            </span>
                            <span className="text-xs text-gray-400">상품 {order.items.length}개</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 dark:text-white">{order.receiverName}</span>
                            <span className="text-xs text-gray-400">User ID: {order.userId}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deliveryStatusBadge.className}`}
                          >
                            {deliveryStatusBadge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white text-right">
                          {formatPrice(order.totalAmount)}원
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleViewDetail(order.orderId)}
                            className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2632] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                이전
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-[#1a2632] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2632] text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </main>
    </div>
  );
}

