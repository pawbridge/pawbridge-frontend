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
}

// 비밀번호 재설정 - 1단계 요청 (인증 코드 발송)
export interface ResetPasswordRequestRequest {
  email: string;
}

// 비밀번호 재설정 - 2단계 요청 (인증 및 비밀번호 변경)
export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// 이메일 인증 코드 발송 요청
export interface SendVerificationCodeRequest {
  email: string;
}

// 이메일 인증 코드 검증 요청
export interface VerifyCodeRequest {
  email: string;
  code: string;  // 6자리 숫자
}

// 이메일 인증 코드 검증 응답
export interface EmailVerifiedResponse {
  verified: boolean;
}

// 동물 상태 타입
export type AnimalStatus = 
  | 'PROTECT'           // 보호중
  | 'ADOPTION_PENDING'  // 입양대기중 (입양 절차 진행 중)
  | 'ADOPTED'           // 종료(입양)
  | 'EUTHANIZED'        // 종료(안락사)
  | 'NATURAL_DEATH'     // 종료(자연사)
  | 'RETURNED'          // 종료(반환) - 주인에게 반환
  | 'DONATED'           // 종료(기증) - 다른 기관에 기증
  | 'RELEASED'          // 종료(방사) - 야생 방사
  | 'ESCAPED'           // 탈출
  | 'UNKNOWN';          // 미상

// 동물 정보
export interface Animal {
  id: number;
  name: string;
  species: 'DOG' | 'CAT' | 'ETC' | string;
  breed: string;
  age: number;
  birthYear?: number;          // 출생 연도
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  imageUrl: string;
  imageUrl2?: string;          // 추가 이미지
  status: AnimalStatus;
  // APMS 공공데이터 정보
  noticeNo?: string;           // 공고번호 (프론트 호환용)
  apmsNoticeNo?: string;       // 공고번호 (백엔드 실제 필드)
  noticeStartDate?: string;    // 공고 시작일
  noticeEndDate?: string;      // 공고 종료일
  region?: string;             // 지역 (시/도)
  city?: string;               // 시/군/구
  foundPlace?: string;         // 발견 장소
  happenPlace?: string;        // 발견 장소 (API 실제 필드)
  happenDate?: string;         // 접수일
  shelterName?: string;        // 보호소 이름
  shelter?: {                  // 보호소 정보 (중첩)
    id: number;
    name: string;
    phone?: string;            // 전화번호 (백엔드 제공 예정)
    address?: string;          // 주소 (백엔드 제공 예정)
    operatingHours?: string;   // 운영시간 (백엔드 제공 예정)
  };
  weight?: string;             // 체중
  color?: string;              // 색상
  neuterStatus?: 'YES' | 'NO' | 'UNKNOWN';  // 중성화 여부
  neutered?: boolean;          // 중성화 여부 (호환성)
  description?: string;        // 특징 및 설명
  specialMark?: string;        // 특이사항
  favoriteCount?: number;      // 찜 횟수
  createdAt?: string;          // 등록일
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

// 동물 검색 파라미터
export interface AnimalSearchParams {
  page?: number;               // 페이지 번호 (0부터 시작)
  size?: number;               // 페이지 크기 (기본 20)
  sort?: string;               // 정렬 (예: "createdAt,desc")
  species?: 'DOG' | 'CAT' | 'ETC';
  breed?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  neuterStatus?: 'YES' | 'NO' | 'UNKNOWN';
  status?: AnimalStatus;  // 동물 상태 (전체 enum 값)
  minAge?: number;
  maxAge?: number;
  region?: string;
  city?: string;
  keyword?: string;            // 통합 검색
}

// ========== 상품(Store) 관련 타입 ==========

// 상품 상태
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';

// 상품 카테고리
export interface Category {
  id: number;
  name: string;
  parentId?: number;
}

// SKU 옵션
export interface SkuOption {
  [key: string]: string;       // 예: { "Color": "Red", "Size": "L" }
}

// SKU (재고 관리 단위)
export interface ProductSku {
  skuId: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  options: SkuOption;
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
  parentId: number | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentId: number | null;
}

// 이미지 업로드 응답
export interface ImageUploadResponse {
  imageUrl: string;
}

// 상품 등록 요청 (새 API 스펙)
export interface CreateSku {
  skuCode: string;
  price: number;
  stockQuantity: number;
  optionValueIds: number[];  // 옵션 값 ID 배열
}

export interface CreateProductRequest {
  name: string;
  description: string;
  imageUrl: string;
  categoryId: number;  // 카테고리 ID 필수
  skus: CreateSku[];
}

// 장바구니 아이템
export interface CartItem {
  skuId: number;
  productId: number;
  productName: string;
  skuCode: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

// 장바구니 추가 요청
export interface AddToCartRequest {
  skuId: number;
  quantity: number;
}

// ========== 주문(Order) 관련 타입 ==========

// 주문 상태
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// 주문 생성 요청 (장바구니 기반)
export interface CreateOrderRequest {
  receiverName: string;
  receiverPhone: string;
  deliveryAddress: string;
  deliveryMessage?: string;
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
export type BoardType = 'MISSING' | 'PROTECTION' | 'REPORT' | 'ADOPTION' | 'COMMUNICATION';

// 게시글 생성 요청 (multipart/form-data로 전송)
export interface CreatePostRequest {
  title: string;
  content: string;
  boardType: BoardType;
}

// 게시글 수정 요청 (multipart/form-data로 전송)
export interface UpdatePostRequest {
  title: string;
  content: string;
}

// 게시글 응답
export interface PostResponse {
  postId: number;
  authorId: number;
  authorNickname: string;
  title: string;
  content: string;
  boardType: BoardType;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
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
  commentId: number;
  postId: number;
  authorId: number;
  authorNickname: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 주문 생성 응답
export interface CreateOrderResponse {
  orderId: number;
  orderUuid: string;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  receiverName: string;
}

// 주문 아이템
export interface OrderItem {
  productName: string;
  skuCode: string;
  price: number;
  quantity: number;
}

// 주문 상세
export interface OrderDetail {
  orderId: number;
  orderUuid?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  receiverName?: string;
  receiverPhone?: string;
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
