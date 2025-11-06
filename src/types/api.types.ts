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
  
  // 동물 정보 (나중에 추가)
  export interface Animal {
    id: number;
    name: string;
    species: string;
    breed: string;
    age: number;
    gender: 'MALE' | 'FEMALE';
    imageUrl: string;
    status: 'AVAILABLE' | 'ADOPTED';
  }