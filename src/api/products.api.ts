import apiClient from './client';
import type { 
  Product, 
  ProductSearchParams, 
  ProductSearchResponse,
  CartItem,
  AddToCartRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  DirectOrderRequest,
  CreateProductRequest,
  OptionGroupResponse,
  CategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImageUploadResponse,
  CreateOptionGroupRequest,
  UpdateOptionGroupRequest,
  CreateOptionValueRequest,
  UpdateOptionValueRequest,
  OptionValue
} from '../types/api.types';

// 상품 목록 검색
export const getProducts = async (params?: ProductSearchParams): Promise<ProductSearchResponse> => {
  const response = await apiClient.get<ProductSearchResponse>('/api/products', { params });
  return response.data;
};

// 상품 상세 조회
export const getProductById = async (productId: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/api/products/${productId}`);
  return response.data;
};

// 장바구니 조회
export const getCart = async (): Promise<CartItem[]> => {
  const response = await apiClient.get<CartItem[]>('/api/carts');
  return response.data;
};

// 장바구니에 상품 추가
export const addToCart = async (item: AddToCartRequest): Promise<CartItem[]> => {
  const response = await apiClient.post<CartItem[]>('/api/carts/items', item);
  return response.data;
};

// 장바구니 비우기
export const clearCart = async (): Promise<void> => {
  await apiClient.delete('/api/carts');
};

// 주문 생성 (장바구니 기반)
export const createOrder = async (orderData: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/api/orders', orderData);
  return response.data;
};

// 바로 주문 생성 (장바구니 생략)
export const createDirectOrder = async (orderData: DirectOrderRequest): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/api/orders/direct', orderData);
  return response.data;
};

// 주문 상세 조회
export const getOrderById = async (orderId: number): Promise<OrderDetail> => {
  const response = await apiClient.get<OrderDetail>(`/api/orders/${orderId}`);
  return response.data;
};

// 결제 처리 (Mock) - Store Service
export const processPayment = async (orderId: number): Promise<void> => {
  await apiClient.post(`/api/orders/${orderId}/payment`);
};

// 토스페이먼츠 결제 승인 - Payment Service (8084)
export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;  // UUID
  amount: number;
}

export const confirmPayment = async (data: PaymentConfirmRequest): Promise<void> => {
  await apiClient.post('/api/payments/confirm', data);
};

// 상품 등록
export const createProduct = async (productData: CreateProductRequest): Promise<Product> => {
  const response = await apiClient.post<Product>('/api/products', productData);
  return response.data;
};

// 옵션 그룹 목록 조회
export const getOptionGroups = async (): Promise<OptionGroupResponse[]> => {
  const response = await apiClient.get<OptionGroupResponse[]>('/api/option-groups');
  return response.data;
};

// 카테고리 목록 조회
export const getCategories = async (): Promise<CategoryResponse[]> => {
  const response = await apiClient.get<CategoryResponse[]>('/api/categories');
  return response.data;
};

// 이미지 업로드
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ImageUploadResponse>('/api/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 카테고리 생성
export const createCategory = async (categoryData: CreateCategoryRequest): Promise<CategoryResponse> => {
  const response = await apiClient.post<CategoryResponse>('/api/categories', categoryData);
  return response.data;
};

// 카테고리 수정
export const updateCategory = async (categoryId: number, categoryData: UpdateCategoryRequest): Promise<CategoryResponse> => {
  const response = await apiClient.put<CategoryResponse>(`/api/categories/${categoryId}`, categoryData);
  return response.data;
};

// 카테고리 삭제
export const deleteCategory = async (categoryId: number): Promise<void> => {
  await apiClient.delete(`/api/categories/${categoryId}`);
};

// 옵션 그룹 상세 조회
export const getOptionGroupById = async (groupId: number): Promise<OptionGroupResponse> => {
  const response = await apiClient.get<OptionGroupResponse>(`/api/option-groups/${groupId}`);
  return response.data;
};

// 옵션 그룹 생성
export const createOptionGroup = async (groupData: CreateOptionGroupRequest): Promise<OptionGroupResponse> => {
  const response = await apiClient.post<OptionGroupResponse>('/api/option-groups', groupData);
  return response.data;
};

// 옵션 그룹 수정
export const updateOptionGroup = async (groupId: number, groupData: UpdateOptionGroupRequest): Promise<OptionGroupResponse> => {
  const response = await apiClient.put<OptionGroupResponse>(`/api/option-groups/${groupId}`, groupData);
  return response.data;
};

// 옵션 그룹 삭제
export const deleteOptionGroup = async (groupId: number): Promise<void> => {
  await apiClient.delete(`/api/option-groups/${groupId}`);
};

// 옵션 값 추가
export const createOptionValue = async (groupId: number, valueData: CreateOptionValueRequest): Promise<OptionValue> => {
  const response = await apiClient.post<OptionValue>(`/api/option-groups/${groupId}/values`, valueData);
  return response.data;
};

// 옵션 값 수정
export const updateOptionValue = async (valueId: number, valueData: UpdateOptionValueRequest): Promise<OptionValue> => {
  const response = await apiClient.put<OptionValue>(`/api/option-groups/values/${valueId}`, valueData);
  return response.data;
};

// 옵션 값 삭제
export const deleteOptionValue = async (valueId: number): Promise<void> => {
  await apiClient.delete(`/api/option-groups/values/${valueId}`);
};

