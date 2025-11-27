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
  userType: 'GENERAL' | 'SHELTER';
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
  accessToken: string;
  refreshToken: string;
}

// 회원가입 요청
export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  rePassword: string;
  userType?: 'GENERAL' | 'SHELTER';
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
