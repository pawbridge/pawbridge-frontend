import axios from 'axios';
import type { ApplicationStatus } from '../../api/shelter.api';
export const panel = 'rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-700 dark:bg-gray-900';
export const control = 'min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-800';
export const input = 'mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white';
export const labels: Record<ApplicationStatus, string> = { PENDING: '검토 대기', APPROVED: '승인 완료', REJECTED: '반려' };
export function date(value: string | null) { return value ? new Date(value).toLocaleString('ko-KR') : '—'; }
export function errorMessage(error: unknown) {
  if(axios.isAxiosError(error)) {
    if(error.response?.status === 409) return '이미 처리되었거나 검토 중인 신청이 있습니다. 최신 상태를 다시 확인해 주세요.';
    if(error.response?.status === 403) return '이 작업을 수행할 권한이 없습니다.';
    if(error.response?.status === 404) return '신청 또는 보호소를 찾을 수 없습니다. 입력한 번호를 확인해 주세요.';
    if(error.response?.status === 400) return '입력 내용을 확인해 주세요.';
  }
  return '요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
