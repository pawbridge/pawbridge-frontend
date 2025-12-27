// 공통 API 응답 구조
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// 사용자 정보
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER'; // 백엔드 JWT에 포함되는 역할
  careRegNo?: string;          // 보호소 직원일 때만 존재
  createdAt: string;
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  userId: number;
  email: string;
  name: string;
  role?: 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER'; // 백엔드가 내려줄 경우 반영
  careRegNo?: string;           // 보호소 직원일 때만 존재
  accessToken: string;
  refreshToken: string;
}

// 회원가입 요청
export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  rePassword: string;
  role: 'ROLE_USER' | 'ROLE_SHELTER';  // 백엔드 요구사항에 맞춤
  careRegNo?: string;  // 보호소 등록번호 (ROLE_SHELTER인 경우 필수)
}

// 회원가입 응답
export interface SignupResponse {
  userId: number;
  email: string;
  name: string;
  nickname: string;
  role: 'ROLE_USER' | 'ROLE_SHELTER';
  careRegNo?: string;
  createdAt: string;
}

// 비밀번호 재설정 코드 발송 요청
export interface SendResetCodeRequest {
  email: string;
}

// 비밀번호 재설정 요청
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// 비밀번호 재설정 응답
export interface ResetPasswordResponse {
  message: string;
}

// 이메일 인증 코드 발송 요청
export interface SendVerificationCodeRequest {
  email: string;
}

// 이메일 인증 코드 확인 요청
export interface VerifyCodeRequest {
  email: string;
  code: string;
}

// 이메일 인증 완료 응답
export interface EmailVerifiedResponse {
  verified: boolean;
  message?: string;
}

// ========== 동물(Animal) 관련 타입 ==========

// 동물 정보
export interface Animal {
  id: number;
  name: string;
  species: string;              // 종 (강아지, 고양이 등)
  breed?: string;               // 품종
  gender: 'MALE' | 'FEMALE' | 'NEUTERED';  // 성별
  age?: number;                 // 나이 (개월)
  weight?: number;              // 체중 (kg)
  description?: string;         // 설명
  imageUrl?: string;            // 이미지 URL
  imageUrl2?: string;           // 추가 이미지 URL
  status: 'AVAILABLE' | 'ADOPTED' | 'RESERVED' | 'UNAVAILABLE' | 'PROTECT' | 'ADOPTION_PENDING' | 'EUTHANIZED' | 'NATURAL_DEATH' | 'RETURNED' | 'DONATED' | 'RELEASED' | 'ESCAPED' | 'UNKNOWN';  // 상태
  shelterId: number;            // 보호소 ID
  shelterName?: string;         // 보호소 이름
  shelter?: any;                // 보호소 정보 (임시)
  careRegNo?: string;           // 보호소 등록번호
  favoriteCount?: number;        // 찜 횟수
  createdAt?: string;            // 등록일
  updatedAt?: string;            // 수정일
  // 추가 필드들
  noticeNo?: string;            // 공고번호
  apmsNoticeNo?: string;        // APMS 공고번호
  noticeStartDate?: string;   // 공고 시작일
  noticeEndDate?: string;       // 공고 종료일
  color?: string;               // 색상
  neutered?: boolean;           // 중성화 여부
  neuterStatus?: string;        // 중성화 상태
  region?: string;              // 지역
  city?: string;                // 시/군/구
  foundPlace?: string;          // 발견 장소
  happenPlace?: string;         // 발생 장소
  happenDate?: string;         // 발생 일자
  birthYear?: number;           // 출생년도
  specialMark?: string;         // 특이사항
}

// 동물 검색 파라미터
export interface AnimalSearchParams {
  keyword?: string;              // 검색어 (이름, 품종, 설명)
  species?: string;             // 종 필터
  gender?: 'MALE' | 'FEMALE' | 'NEUTERED';
  status?: 'AVAILABLE' | 'ADOPTED' | 'RESERVED' | 'UNAVAILABLE' | 'PROTECT';
  shelterId?: number;           // 보호소 ID
  careRegNo?: string;            // 보호소 등록번호
  minAge?: number;               // 최소 나이
  maxAge?: number;               // 최대 나이
  page?: number;                 // 페이지 번호 (기본 0)
  size?: number;                 // 페이지 크기 (기본 20)
  sortBy?: 'createdAt' | 'name' | 'age';  // 정렬 기준
  sortOrder?: 'asc' | 'desc';    // 정렬 순서
  // 추가 필터
  sort?: string;                 // 정렬 (임시)
  breed?: string;                // 품종
  neuterStatus?: string;        // 중성화 상태
  region?: string;               // 지역
  city?: string;                 // 시/군/구
}

// 동물 검색 응답
export interface AnimalSearchResponse {
  items: Animal[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

// ========== 상품(Product) 관련 타입 ==========

// 상품 상태
export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'SOLD_OUT' | 'DELETED';

// 상품 SKU
export interface ProductSku {
  id: number;
  skuId?: number;              // id와 동일 (호환성을 위해)
  skuCode: string;
  price: number;
  stockQuantity: number;
  optionValueIds: number[];     // 옵션 값 ID 배열
  optionName?: string;          // 옵션 조합 이름 (예: "Color: Red, Size: L")
  options?: Record<string, string>; // 옵션 정보 (Map 형태, 예: { "Color": "Red", "Size": "L" })
}

// 상품 정보 (상세)
export interface Product {
  productId: number;
  name: string;
  description: string;
  imageUrl: string;
  status: ProductStatus;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: number;
  categoryName?: string;
  skus?: ProductSku[];
}

// 상품 목록 아이템 (검색 결과)
export interface ProductListItem {
  id: number;
  skuId: number;
  name: string;
  optionName?: string;         // 예: "Color: Red, Size: L"
  price: number;
  totalStock: number;
  imageUrl?: string;
  status?: ProductStatus;
  createdAt?: string;          // 등록일
}

// 상품 검색 파라미터
export interface ProductSearchParams {
  keyword?: string;            // 검색어 (상품명, 설명, 옵션명)
  categoryId?: number;         // 카테고리 ID
  minPrice?: number;           // 최소 가격
  maxPrice?: number;           // 최대 가격
  inStockOnly?: boolean;       // 재고 있는 상품만 (기본: false)
  sortBy?: 'price' | 'createdAt' | 'skuId';  // 정렬 기준 (기본: skuId)
  sortOrder?: 'asc' | 'desc';  // 정렬 순서 (기본: desc)
  page?: number;               // 페이지 번호 (기본 0)
  size?: number;               // 페이지 크기 (기본 20)
  status?: ProductStatus;       // 상품 상태 필터
}

// 상품 검색 응답
export interface ProductSearchResponse {
  items: ProductListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

// 옵션 값
export interface OptionValue {
  id: number;
  name: string;
  groupId: number;
  groupName: string;
}

// 옵션 그룹 (API 응답)
export interface OptionGroupResponse {
  id: number;
  name: string;
  values: OptionValue[];
}

// 옵션 그룹 생성 요청
export interface CreateOptionGroupRequest {
  name: string;
  values?: string[]; // 옵션 값 이름 배열 (생성 시 함께 생성)
}

// 옵션 그룹 수정 요청
export interface UpdateOptionGroupRequest {
  name: string;
}

// 옵션 값 생성 요청
export interface CreateOptionValueRequest {
  name: string;
}

// 옵션 값 수정 요청
export interface UpdateOptionValueRequest {
  name: string;
}

// 카테고리 (API 응답)
export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  parentId: number | null;
  children: CategoryResponse[];
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentId?: number | null;
}

// 상품 생성 요청
export interface CreateProductRequest {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  skus: {
    skuCode: string;
    price: number;
    stockQuantity: number;
    optionValueIds: number[];     // 옵션 값 ID 배열
  }[];
}

// 상품 수정 요청
export interface UpdateSku {
  id: number; // SKU ID 필수
  price?: number;
  stockQuantity?: number;
  // optionValueIds는 수정 불가
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  status?: ProductStatus;
  categoryId?: number;
  skus?: UpdateSku[];
}

// 이미지 업로드 응답
export interface ImageUploadResponse {
  imageUrl: string;
}

// 페이지네이션 응답 (Spring Data JPA Page 형식)
export interface PageResponse<T> {
  content: T[];                // 데이터 목록
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;          // 전체 페이지 수
  totalElements: number;       // 전체 결과 수
  last: boolean;               // 마지막 페이지 여부
  first: boolean;              // 첫 페이지 여부
  numberOfElements: number;    // 현재 페이지의 결과 수
  size: number;                // 페이지 크기
  number: number;              // 현재 페이지 번호
  empty: boolean;              // 결과가 비어있는지 여부
}

// ========== 장바구니(Cart) 관련 타입 ==========

// 장바구니 아이템
export interface CartItem {
  id: number;
  skuId: number;
  skuCode: string;
  productId: number;
  productName: string;
  productImageUrl: string;
  optionName?: string;         // 예: "Color: Red, Size: L"
  price: number;
  quantity: number;
  stockQuantity: number;       // 현재 재고
}

// 장바구니에 상품 추가 요청
export interface AddToCartRequest {
  skuId: number;
  quantity: number;
}

// ========== 주문(Order) 관련 타입 ==========

// 주문 아이템
export interface OrderItem {
  skuId: number;
  skuCode: string;
  productName: string;
  optionName?: string;
  price: number;
  quantity: number;
}

// 주문 생성 요청
export interface CreateOrderRequest {
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMessage?: string;
  orderItems: OrderItem[];
}

// 주문 생성 응답
export interface CreateOrderResponse {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  orderedAt: string;
}

// 주문 상세 정보
export interface OrderDetail {
  orderId: number;
  orderNumber: string;
  status: 'PENDING' | 'PAID' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMessage?: string;
  orderedAt?: string;
  orderItems: OrderItem[];
}

// 바로 주문 요청 (장바구니 생략)
export interface DirectOrderRequest {
  skuId: number;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMessage?: string;
}

// ========== 커뮤니티(Community) 관련 타입 ==========

// 게시판 타입
export type BoardType = 'MISSING' | 'COMMUNICATION' | 'ADOPTION' | 'PROTECTION' | 'REPORT';

// 게시글 생성 요청
export interface CreatePostRequest {
  title: string;
  content: string;
  boardType: BoardType;
}

// 게시글 수정 요청
export interface UpdatePostRequest {
  title: string;
  content: string;
}

// 게시글 응답
export interface PostResponse {
  id: number;
  title: string;
  content: string;
  boardType: BoardType;
  authorId: number;
  authorName: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  likeCount?: number;
}

// 댓글 생성 요청
export interface CreateCommentRequest {
  content: string;
}

// 댓글 수정 요청
export interface UpdateCommentRequest {
  content: string;
}

// 댓글 응답
export interface CommentResponse {
  id: number;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

// ========== 위시리스트(Wishlist) 관련 타입 ==========

// 위시리스트 아이템
export interface WishlistItem {
  wishlistId: number;
  skuId: number;
  skuCode: string;
  productId: number;
  productName: string;
  productDescription?: string;
  productImageUrl: string;
  productStatus: ProductStatus;
  price: number;
  options: Record<string, string>; // Map 형태, 예: { "Color": "Red", "Size": "L" }
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
}

// 위시리스트 검색 파라미터
export interface WishlistSearchParams {
  page?: number;  // 페이지 번호 (기본 0)
  size?: number;  // 페이지 크기 (기본 20)
}

// 위시리스트 검색 응답
export interface WishlistSearchResponse extends PageResponse<WishlistItem> {}
