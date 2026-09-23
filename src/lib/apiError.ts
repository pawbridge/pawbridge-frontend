import { isAxiosError } from 'axios';

// 오류 본문은 성공 응답 타입과 달리 보장되지 않는다(네트워크·게이트웨이 오류 등).
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<unknown>(error)) return fallback;
  const data = error.response?.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return fallback;
  return typeof data.message === 'string' && data.message.trim() ? data.message : fallback;
}
