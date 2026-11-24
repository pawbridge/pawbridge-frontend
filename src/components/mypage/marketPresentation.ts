import type { ProductStatus, OrderStatus } from '../../types/api.types';

// 가격 포맷팅
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

// 상품 상태 배지. 상태는 글자로 구분하고 색은 쓰지 않는다(Badge neutral).
export const getStatusBadge = (status: ProductStatus) => {
  switch (status) {
    case 'ACTIVE':
      return { text: '판매중' };
    case 'SOLD_OUT':
      return { text: '품절' };
    case 'HIDDEN':
      return { text: '숨김' };
    case 'DELETED':
      return { text: '삭제됨' };
    default:
      return { text: '알 수 없음' };
  }
};

// 관심 상품의 담기 버튼. 판매중인 상품만 담을 수 있고, 나머지는 담을 수 없는 이유를 버튼 글자로 보인다.
export const getCartAvailability = (status: ProductStatus) => {
  if (status === 'ACTIVE') return { canAdd: true, label: '담기' };
  if (status === 'SOLD_OUT') return { canAdd: false, label: '품절' };
  return { canAdd: false, label: '판매 중지' };
};

// 주문 상태 배지
export const getOrderStatusBadge = (status: OrderStatus) => {
  // 주문 상태는 글자로 구분하고 색은 쓰지 않는다(Badge neutral). 색은 오류, 마감 임박, 주 동작에만 쓴다.
  const labels: Record<string, string> = {
    PENDING: '주문 대기',
    PAID: '결제 완료',
    COMPLETED: '주문 완료',
    CANCELLED: '주문 취소',
    FAILED: '결제 실패',
  };
  return { label: labels[status] ?? labels.PENDING };
};
