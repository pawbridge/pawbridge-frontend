import type { ProductStatus, OrderStatus } from '../../types/api.types';

// 가격 포맷팅
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 상품 상태 배지
export const getStatusBadge = (status: ProductStatus) => {
  switch (status) {
    case 'ACTIVE':
      return { text: '판매중', className: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-[#163126] dark:text-[#DDEFE9]' };
    case 'SOLD_OUT':
      return { text: '품절', className: 'bg-gray-600 text-white ring-gray-600/20' };
    case 'HIDDEN':
      return { text: '숨김', className: 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300' };
    case 'DELETED':
      return { text: '삭제됨', className: 'bg-red-50 text-red-600 ring-red-600/20 dark:text-red-300 dark:bg-red-950' };
    default:
      return { text: '알 수 없음', className: 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300' };
  }
};

// 주문 상태 배지
export const getOrderStatusBadge = (status: OrderStatus) => {
  // 주문 상태는 글자로 구분하고 색은 쓰지 않는다(무채색 배지). 색은 오류, 마감 임박, 주 동작에만 쓴다.
  const labels: Record<string, string> = {
    PENDING: '주문 대기',
    PAID: '결제 완료',
    COMPLETED: '주문 완료',
    CANCELLED: '주문 취소',
    FAILED: '결제 실패',
  };
  return { label: labels[status] ?? labels.PENDING, className: 'bg-neutral-100 text-brand-ink dark:bg-stone-800 dark:text-gray-200' };
};
