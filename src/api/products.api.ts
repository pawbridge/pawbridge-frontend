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
  OptionValue,
  UpdateProductRequest,
  WishlistSearchParams,
  WishlistSearchResponse
} from '../types/api.types';

// 상품 목록 검색
export const getProducts = async (params?: ProductSearchParams): Promise<ProductSearchResponse> => {
  const response = await apiClient.get<ProductSearchResponse>('/api/products', { params });
  console.log('getProducts API 응답:', response.data);
  console.log('요청 파라미터:', params);
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
  const response = await apiClient.get<{ code: number; data: CategoryResponse[]; message: string } | CategoryResponse[]>('/api/categories');
  console.log('getCategories 전체 응답:', response);
  console.log('getCategories response.data:', response.data);
  
  // 응답 구조 확인: { code, data, message } 형식이거나 직접 배열 형식일 수 있음
  const responseData = response.data;
  
  // { code, data, message } 형식인 경우
  if (responseData && typeof responseData === 'object' && 'code' in responseData && 'data' in responseData && Array.isArray(responseData.data)) {
    console.log('응답 형식: { code, data, message }');
    return responseData.data;
  }
  
  // 직접 배열인 경우
  if (Array.isArray(responseData)) {
    console.log('응답 형식: 직접 배열');
    return responseData;
  }
  
  // 예상치 못한 형식
  console.error('예상치 못한 응답 형식:', responseData);
  throw new Error('예상치 못한 API 응답 형식입니다.');
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

// 상품 수정
export const updateProduct = async (productId: number, productData: UpdateProductRequest): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/api/products/${productId}`, productData);
  return response.data;
};

// 상품 삭제 (소프트 삭제)
export const deleteProduct = async (productId: number): Promise<void> => {
  await apiClient.delete(`/api/products/${productId}`);
};

// ========== 위시리스트(Wishlist) 관련 API ==========

// 개발 환경용 Mock 데이터
const mockWishlistData: WishlistSearchResponse = {
  content: [
    {
      wishlistId: 1,
      skuId: 10,
      skuCode: 'PADDING-RED-L',
      productId: 5,
      productName: '프리미엄 강아지 패딩',
      productDescription: '따뜻한 겨울 패딩으로 추운 날씨에도 걱정 없어요',
      productImageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
      productStatus: 'ACTIVE',
      price: 35000,
      options: { Color: 'Red', Size: 'L' },
      categoryId: 1,
      categoryName: '강아지용품',
      createdAt: '2024-12-27T14:30:00',
    },
    {
      wishlistId: 2,
      skuId: 11,
      skuCode: 'TOY-DUCK-S',
      productId: 6,
      productName: '삑삑이 오리 인형 (강아지 장난감)',
      productDescription: '부드러운 소재로 안전하게 놀아요',
      productImageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
      productStatus: 'ACTIVE',
      price: 12000,
      options: { Size: 'One Size' },
      categoryId: 2,
      categoryName: '장난감',
      createdAt: '2024-11-02T10:15:00',
    },
    {
      wishlistId: 3,
      skuId: 12,
      skuCode: 'LEASH-BROWN-M',
      productId: 7,
      productName: '소가죽 이태리 인식표 목줄 (각인무료)',
      productDescription: '튼튼하고 멋스러운 천연 가죽',
      productImageUrl: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400',
      productStatus: 'SOLD_OUT',
      price: 25000,
      options: { Color: 'Brown', Size: 'M' },
      categoryId: 3,
      categoryName: '외출용품',
      createdAt: '2024-10-15T09:20:00',
    },
    {
      wishlistId: 4,
      skuId: 13,
      skuCode: 'FOOD-SALMON-1KG',
      productId: 8,
      productName: '[특가] 유기농 고양이 사료 1kg',
      productDescription: '건강한 원료로 만든 프리미엄 사료',
      productImageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
      productStatus: 'ACTIVE',
      price: 18000,
      options: { Option: '연어맛' },
      categoryId: 4,
      categoryName: '식품/사료',
      createdAt: '2024-09-28T16:45:00',
    },
    {
      wishlistId: 5,
      skuId: 14,
      skuCode: 'BED-WHITE-L',
      productId: 9,
      productName: '꿀잠 보장 구름 방석 (대형)',
      productDescription: '구름 위에 누운 듯한 편안함',
      productImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      productStatus: 'ACTIVE',
      price: 45000,
      options: { Color: 'White', Size: 'L' },
      categoryId: 5,
      categoryName: '리빙/홈',
      createdAt: '2024-09-10T11:30:00',
    },
  ],
  totalElements: 5,
  totalPages: 1,
  number: 0,
  size: 20,
  first: true,
  last: true,
  numberOfElements: 5,
  empty: false,
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    sort: { sorted: false, unsorted: true, empty: true },
    offset: 0,
    paged: true,
    unpaged: false,
  },
};

// 위시리스트 목록 조회
export const getWishlists = async (userId: number, params?: WishlistSearchParams): Promise<WishlistSearchResponse> => {
  // Mock 데이터 사용 여부 (환경 변수로 제어, 기본값: false = 실제 서버 연동)
  const useMock = import.meta.env.VITE_USE_WISHLIST_MOCK === 'true';
  
  if (useMock) {
    console.log('[Mock] 위시리스트 목록 조회 - userId:', userId, 'params:', params);
    // 페이징 시뮬레이션
    const page = params?.page || 0;
    const size = params?.size || 20;
    const start = page * size;
    const end = start + size;
    const paginatedContent = mockWishlistData.content.slice(start, end);
    
    return {
      ...mockWishlistData,
      content: paginatedContent,
      number: page,
      size: size,
      numberOfElements: paginatedContent.length,
      first: page === 0,
      last: end >= mockWishlistData.content.length,
    };
  }
  
  // 실제 서버 연동
  console.log('[API] 위시리스트 목록 조회 - userId:', userId, 'params:', params);
  const response = await apiClient.get<WishlistSearchResponse>(`/api/v1/mypage/wishlists`, {
    params: {
      userId,
      ...params
    }
  });
  console.log('[API] 위시리스트 목록 응답:', response.data);
  return response.data;
};

// 위시리스트 삭제 (wishlistId로)
export const deleteWishlist = async (wishlistId: number): Promise<void> => {
  // Mock 데이터 사용 여부 (환경 변수로 제어, 기본값: false = 실제 서버 연동)
  const useMock = import.meta.env.VITE_USE_WISHLIST_MOCK === 'true';
  
  if (useMock) {
    console.log('[Mock] 위시리스트 삭제 - wishlistId:', wishlistId);
    // 실제로는 아무것도 하지 않음 (UI에서만 제거됨)
    return Promise.resolve();
  }
  
  // 실제 서버 연동
  console.log('[API] 위시리스트 삭제 - wishlistId:', wishlistId);
  await apiClient.delete(`/api/wishlists/${wishlistId}`);
};

