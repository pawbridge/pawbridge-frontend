import MyPageListState, { type MyPageListFeedback } from './MyPageListState';
import { Link } from 'react-router-dom';
import type { OrderListResponse, OrderStatus } from '../../types/api.types';
import { formatPrice, getOrderStatusBadge } from './marketPresentation';

interface MyOrdersPanelProps {
  feedback: MyPageListFeedback;
  ordersData: OrderListResponse | undefined;
  statusFilter: OrderStatus | 'ALL';
  ordersPage: number;
  onStatusChange: (status: OrderStatus | 'ALL') => void;
  onPageChange: (page: number) => void;
  onOrderDetail: (orderId: number) => void;
}

export default function MyOrdersPanel({
  feedback,
  ordersData,
  statusFilter,
  ordersPage,
  onStatusChange,
  onPageChange,
  onOrderDetail,
}: MyOrdersPanelProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
          나의 주문 목록
        </h2>
        <div className="min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus | 'ALL')}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-focus"
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">주문 대기</option>
            <option value="PAID">결제 완료</option>
            <option value="COMPLETED">주문 완료</option>
            <option value="CANCELLED">주문 취소</option>
          </select>
        </div>
      </div>

      <MyPageListState label="주문 내역을" {...feedback}>
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
                            onClick={() => onOrderDetail(order.orderId)}
                            className="text-sm text-brand-accent hover:underline font-medium"
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
                  onClick={() => onPageChange(Math.max(0, ordersPage - 1))}
                  disabled={ordersPage === 0}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  이전
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: ordersData.totalPages }, (_, i) => i).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ordersPage === page
                          ? 'bg-brand text-brand-ink'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onPageChange(Math.min(ordersData.totalPages - 1, ordersPage + 1))}
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-brand-ink shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all"
            >
              쇼핑하러 가기
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </MyPageListState>
    </>
  );
}
