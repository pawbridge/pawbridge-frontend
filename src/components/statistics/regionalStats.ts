import type { RegionalAnimalStats } from '../../types/api.types';

export const provinces = [
  { name: '서울특별시', short: '서울', coordinates: [126.978, 37.566] },
  { name: '부산광역시', short: '부산', coordinates: [129.075, 35.18] },
  { name: '대구광역시', short: '대구', coordinates: [128.60, 35.87] },
  { name: '인천광역시', short: '인천', coordinates: [126.60, 37.46] },
  { name: '광주광역시', short: '광주', coordinates: [126.85, 35.16] },
  { name: '대전광역시', short: '대전', coordinates: [127.384, 36.35] },
  { name: '울산광역시', short: '울산', coordinates: [129.31, 35.55] },
  { name: '세종특별자치시', short: '세종', coordinates: [127.289, 36.48] },
  { name: '경기도', short: '경기', coordinates: [127.28, 37.75] },
  { name: '강원특별자치도', short: '강원', coordinates: [128.25, 37.65] },
  { name: '충청북도', short: '충북', coordinates: [127.80, 36.85] },
  { name: '충청남도', short: '충남', coordinates: [126.80, 36.55] },
  { name: '전북특별자치도', short: '전북', coordinates: [127.05, 35.82] },
  { name: '전라남도', short: '전남', coordinates: [126.80, 34.75] },
  { name: '경상북도', short: '경북', coordinates: [128.85, 36.35] },
  { name: '경상남도', short: '경남', coordinates: [128.20, 35.25] },
  { name: '제주특별자치도', short: '제주', coordinates: [126.53, 33.38] },
] as const;

const legacyNames: Record<string, string> = { 강원도: '강원특별자치도', 전라북도: '전북특별자치도', 제주도: '제주특별자치도' };

export function normalizeRegion(name: string): string {
  const value = name.trim();
  return legacyNames[value] ?? provinces.find(p => p.short === value)?.name ?? value;
}

export function buildRegionRows(data: RegionalAnimalStats[]) {
  const counts = new Map<string, number>(provinces.map(p => [p.name, 0]));
  for (const row of data) {
    const name = normalizeRegion(row.region);
    counts.set(name, (counts.get(name) ?? 0) + row.count);
  }
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
}

// Five shared bins: zero, then four increasing count ranges. Recompute for each period.
export const terrainColors = ['#e8edf2', '#dcefe9', '#6ee7b7', '#047857', '#1f5b4b'] as const;

export function terrainStep(maximum: number) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, maximum / 4)));
  return Math.max(10, Math.ceil(maximum / 4 / magnitude) * magnitude);
}

export function terrainBand(count: number, step: number) {
  return count <= 0 ? 0 : Math.min(4, Math.floor(count / step) + 1);
}

export function kstToday(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function periodStart(end: string, days: number) {
  const date = new Date(`${end}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

export function validateDateRange(start: string, end: string, today: string) {
  if (!start || !end) return '시작일과 종료일을 모두 선택해 주세요.';
  if (start > end) return '종료일은 시작일보다 빠를 수 없습니다.';
  if (end > today) return '오늘까지의 기간을 선택해 주세요.';
  return '';
}
