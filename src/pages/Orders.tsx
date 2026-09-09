import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/orders.api';
import type { OrderStatus } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuthStore } from '../store/authStore';

export default function Orders() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // 주문 내역 조회 (테스트용: user?.id 체크 제거)
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id || 'test', statusFilter, currentPage],
    queryFn: () =>
      getOrders({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        page: currentPage,
        size: pageSize,
      }),
    enabled: true, // 테스트용: 항상 활성화
  });

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  // 주문 상세 페이지로 이동
  const handleViewDetail = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">주문 내역을 불러오는 중...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-500 mb-4">주문 내역을 불러오는 중 오류가 발생했습니다.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap gap-2 mb-6 text-sm">
          <button onClick={() => navigate('/')} className="text-text-secondary hover:underline">
            Home
          </button>
          <span className="text-text-secondary">/</span>
          <span className="text-text-main dark:text-white font-semibold">주문 내역</span>
        </nav>

        {/* 페이지 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-background-dark dark:text-white">
              주문 내역
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg">
              최근 주문한 내역을 확인하고 배송 상태를 조회할 수 있습니다.
            </p>
          </div>
          <div className="min-w-[200px]">
            <label htmlFor="status-filter" className="sr-only">
              주문 상태 필터
            </label>
            <div className="relative">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | 'ALL');
                  setCurrentPage(0);
                }}
                className="appearance-none w-full bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-background-dark dark:text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer font-medium text-sm shadow-sm"
              >
                <option value="ALL">전체 상태</option>
                <option value="PENDING">주문 대기</option>
                <option value="PAID">결제 완료</option>
                <option value="COMPLETED">주문 완료</option>
                <option value="CANCELLED">주문 취소</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* 주문 목록 테이블 */}
        {orders.length === 0 ? (
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-surface dark:bg-surface-dark shadow-sm p-12">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                receipt_long
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">주문 내역이 없습니다</p>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-surface dark:bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 md:pl-6 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-[40%] min-w-[300px]">
                      상품 정보
                    </th>
                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-[20%] min-w-[140px]">
                      주문일자 / 번호
                    </th>
                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-[20%] min-w-[120px]">
                      결제 금액
                    </th>
                    <th className="p-4 md:pr-6 text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-[20%] min-w-[120px] text-center">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {orders.map((order) => {
                    const firstItem = order.items[0];
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <tr
                        key={order.orderId}
                        className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 md:pl-6 align-top">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"></div>
                            <div className="flex flex-col gap-1">
                              <div className="font-bold text-background-dark dark:text-white line-clamp-2 leading-snug">
                                {firstItem.productName}
                                {order.items.length > 1 && ` 외 ${order.items.length - 1}개`}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {firstItem.skuCode}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                수량: {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-background-dark dark:text-white">
                              {formatDate(order.createdAt)}
                            </span>
                            <button
                              onClick={() => handleViewDetail(order.orderId)}
                              className="text-xs text-gray-500 hover:text-primary hover:underline text-left"
                            >
                              No. {order.orderUuid.slice(0, 13)}
                            </button>
                            <div className="mt-2 text-xs text-gray-400 leading-relaxed hidden sm:block">
                              수령인: {order.receiverName}
                              <br />
                              {order.deliveryAddress.length > 20
                                ? `${order.deliveryAddress.slice(0, 20)}...`
                                : order.deliveryAddress}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <span className="text-base font-bold text-background-dark dark:text-white">
                            {formatPrice(order.totalAmount)}원
                          </span>
                        </td>
                        <td className="p-4 md:pr-6 align-top text-center">
                          <div className="flex flex-col gap-2 items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                            <button
                              onClick={() => handleViewDetail(order.orderId)}
                              className="w-full max-w-[100px] py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium hover:bg-white hover:border-primary hover:text-primary dark:hover:bg-gray-700 transition-colors bg-transparent"
                            >
                              상세 보기
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                      : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

