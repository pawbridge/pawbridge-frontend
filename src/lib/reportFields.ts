import type { ReportAnimalType } from '../types/api.types';

export const reportFieldClass = 'mt-2 h-12 w-full min-w-0 rounded-lg border border-brand-border bg-white px-3 text-base font-normal text-brand-ink focus:border-brand-focus focus:outline-none focus:ring-2 focus:ring-brand-focus dark:border-gray-600 dark:bg-gray-900 dark:text-white';
export const reportAnimalLabels: Record<ReportAnimalType, string> = { DOG: '개', CAT: '고양이', OTHER: '기타 동물' };
