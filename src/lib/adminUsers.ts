import type { UpdateUserRequest } from '../types/user.types';

export const userRoleLabels = { ROLE_USER: '일반회원', ROLE_SHELTER: '보호소회원', ROLE_ADMIN: '관리자' };

export function validateAdminUser(form: UpdateUserRequest): { nickname?: string; careRegNo?: string } {
  const errors: { nickname?: string; careRegNo?: string } = {};
  if (form.nickname && !/^[a-zA-Z0-9가-힣]{2,10}$/.test(form.nickname)) errors.nickname = '닉네임은 2~10자의 한글, 영문, 숫자만 가능합니다.';
  if (form.role === 'ROLE_SHELTER' && !form.careRegNo?.trim()) errors.careRegNo = '보호소 회원은 보호소 등록번호가 필요합니다.';
  return errors;
}

export function adminDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
}
