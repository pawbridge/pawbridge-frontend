import apiClient from './client';
import type {
  OrderListParams,
  OrderListResponse,
  OrderDetail,
  AdminOrderListParams,
  AdminOrderListResponse,
  AdminOrderDetail,
  UpdateOrderStatusRequest,
  UpdateDeliveryStatusRequest,
} from '../types/api.types';

// 일반 사용자용 주문 내역 목록 조회
export const getOrders = async (params?: OrderListParams): Promise<OrderListResponse> => {
  const response = await apiClient.get<OrderListResponse>('/api/orders', { params });
  return response.data;
};

// 일반 사용자용 주문 상세 조회
export const getOrderById = async (orderId: number): Promise<OrderDetail> => {
  const response = await apiClient.get<OrderDetail>(`/api/orders/${orderId}`);
  return response.data;
};

// 관리자용 주문 목록 조회
export const getAdminOrders = async (params?: AdminOrderListParams): Promise<AdminOrderListResponse> => {
  const response = await apiClient.get<AdminOrderListResponse>('/api/admin/orders', { params });
  return response.data;
};

// 관리자용 주문 상세 조회
export const getAdminOrderById = async (orderId: number): Promise<AdminOrderDetail> => {
  const response = await apiClient.get<AdminOrderDetail>(`/api/admin/orders/${orderId}`);
  return response.data;
};

// 주문 상태 변경 (관리자용)
export const updateOrderStatus = async (
  orderId: number,
  data: UpdateOrderStatusRequest
): Promise<AdminOrderDetail> => {
  const response = await apiClient.patch<AdminOrderDetail>(
    `/api/admin/orders/${orderId}/status`,
    data
  );
  return response.data;
};

// 배송 상태 변경 (관리자용)
export const updateDeliveryStatus = async (
  orderId: number,
  data: UpdateDeliveryStatusRequest
): Promise<AdminOrderDetail> => {
  const response = await apiClient.patch<AdminOrderDetail>(
    `/api/admin/orders/${orderId}/delivery-status`,
    data
  );
  return response.data;
};

