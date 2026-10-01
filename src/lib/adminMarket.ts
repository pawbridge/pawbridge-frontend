import type { ProductStatus, OrderStatus, DeliveryStatus } from '../types/api.types';
export const adminProductLabels: Record<ProductStatus, string> = { ACTIVE: '판매중', SOLD_OUT: '품절', HIDDEN: '숨김', DELETED: '삭제됨' };
export const adminOrderLabels: Record<OrderStatus, string> = { PENDING: '주문 대기', PAID: '결제 완료', COMPLETED: '구매 확정', CANCELLED: '주문 취소', FAILED: '결제 실패' };
export const adminDeliveryLabels: Record<DeliveryStatus, string> = { READY: '배송 준비', SHIPPING: '배송 중', DELIVERED: '배송 완료' };
