import type { PageResponse } from './api.types';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SHELTER';

// 브라우저 로그인 상태. 서버의 사용자 조회 응답과 구분한다.
export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;           // 닉네임 (선택적)
  role: UserRole; // 백엔드 JWT에 포함되는 역할
  careRegNo?: string | null;          // 보호소 직원일 때만 존재
  createdAt: string;
}

// ========== 회원 관리(Admin User) 관련 타입 ==========

// 관리자용 회원 목록 항목
export interface AdminUserListItem {
  userId: number;
  email: string;
  name: string;
  nickname?: string | null;
  role: UserRole;
  provider?: string | null;
  careRegNo?: string;
  createdAt: string;
}

// 관리자용 회원 목록 조회 파라미터
export interface AdminUserListParams {
  keyword?: string;              // 검색어 (이메일 또는 닉네임)
  role?: UserRole;  // 역할 필터
  page?: number;                 // 페이지 번호 (기본 0)
  size?: number;                 // 페이지 크기 (기본 20)
  sortBy?: 'createdAt' | 'email' | 'name';  // 정렬 기준
  sortOrder?: 'asc' | 'desc';    // 정렬 순서
}

// 관리자용 회원 목록 응답
export type AdminUserListResponse = PageResponse<AdminUserListItem>;

// 회원 수정 요청 (관리자용)
export interface UpdateUserRequest {
  nickname?: string | null;  // 닉네임 (2~10자)
  role?: UserRole;  // 역할
  careRegNo?: string;  // 보호소 등록번호 (ROLE_SHELTER인 경우)
}

// 사용자 정보 응답
export interface UserInfoResponse {
  userId: number;
  email: string;
  name: string;
  nickname: string | null;
  // 기존 동물 등록 화면에서 참조하지만 현재 UserInfoResponseDto는 내려주지 않는다.
  careRegNo?: string;
  provider: string | null;  // 'EMAIL' | 'GOOGLE' | 'KAKAO' | null
  role: UserRole;
  createdAt: string;
}

// 닉네임 변경 요청
export interface UpdateNicknameRequest {
  nickname: string;
}

// 비밀번호 변경 요청
export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
}
