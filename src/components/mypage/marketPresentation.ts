import type { ProductStatus, OrderStatus } from '../../types/api.types';

// 가격 포맷팅
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 상품 상태 배지
export const getStatusBadge = (status: ProductStatus) => {
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
export const getOrderStatusBadge = (status: OrderStatus) => {
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
