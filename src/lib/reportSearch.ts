import { reportRegions } from './reportRegions.ts';

export type ReportPeriod = 'all' | '7' | '30' | 'custom';
export interface ReportSearch {
  keyword: string;
  province: string;
  district: string;
  animalType: '' | 'DOG' | 'CAT' | 'OTHER';
  period: ReportPeriod;
  from: string;
  to: string;
}
export const emptyReportSearch: ReportSearch = {
  keyword: '', province: '', district: '', animalType: '', period: 'all', from: '', to: '',
};

export function koreaToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function reportPeriodRange(days: 7 | 30, today = koreaToday()) {
  const start = new Date(today + 'T00:00:00Z');
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to: today };
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(value + 'T00:00:00Z'))
    && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}

export function reportSearchError(search: ReportSearch, today = koreaToday()): string {
  if (search.keyword.length > 100) return '검색어는 100자 이하로 입력해 주세요.';
  if (search.province && !reportRegions.some(region => region.value === search.province)) return '시·도를 다시 선택해 주세요.';
  if (search.district.length > 40) return '시·군·구를 다시 선택해 주세요.';
  if (search.district && !search.province) return '시·도를 먼저 선택해 주세요.';
  if (!['', 'DOG', 'CAT', 'OTHER'].includes(search.animalType)) return '동물 종류를 다시 선택해 주세요.';
  if (search.period === 'custom' && (!search.from || !search.to)) return '시작일과 종료일을 모두 선택해 주세요.';
  if ((search.from && (!validDate(search.from) || search.from > today))
    || (search.to && (!validDate(search.to) || search.to > today))
    || (search.from && search.to && search.from > search.to)) return '실종·목격 날짜 범위를 확인해 주세요.';
  return '';
}

export function readReportSearch(params: URLSearchParams): ReportSearch {
  let from = params.get('from') || '';
  let to = params.get('to') || '';
  const value = params.get('period');
  const period: ReportPeriod = value === '7' || value === '30' || value === 'custom'
    ? value : (from || to ? 'custom' : 'all');
  if (!from && !to && (period === '7' || period === '30')) {
    ({ from, to } = reportPeriodRange(Number(period) as 7 | 30));
  }
  return { keyword: params.get('keyword')?.trim() || '', province: params.get('province') || '',
    district: params.get('district') || '', animalType: (params.get('animalType') || '') as ReportSearch['animalType'],
    period, from, to };
}

export function reportSearchParams(search: ReportSearch, page = 0): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ['keyword', 'province', 'district', 'animalType', 'from', 'to'] as const) {
    const value = search[key].trim();
    if (value) params.set(key, value);
  }
  if (search.period !== 'all') params.set('period', search.period);
  if (page > 0) params.set('page', String(page + 1));
  return params;
}
