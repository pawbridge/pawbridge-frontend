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
    accessToken: string;
    refreshToken: string;
    user: User;
  }
  
  // 회원가입 요청
  export interface SignupRequest {
    email: string;
    password: string;
    name: string;
    userType: 'GENERAL' | 'SHELTER';
  }
  
  // 동물 정보
  export interface Animal {
    id: number;
    name: string;
    species: string;
    breed: string;
    age: number;
    gender: 'MALE' | 'FEMALE';
    imageUrl: string;
    status: 'AVAILABLE' | 'ADOPTED';
    // APMS 공공데이터 정보
    noticeNo?: string;           // 공고번호
    noticeStartDate?: string;    // 공고 시작일
    noticeEndDate?: string;      // 공고 종료일
    region?: string;             // 지역 (시/도)
    city?: string;               // 시/군/구
    foundPlace?: string;         // 발견 장소
    shelterName?: string;        // 보호소 이름
    weight?: string;             // 체중
    color?: string;              // 색상
    neutered?: boolean;          // 중성화 여부
    description?: string;        // 특징 및 설명
  }