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

export const terrainColors = ['#e8edf2', '#dcefe9', '#6ee7b7', '#047857', '#1f5b4b'] as const;

// Exact 1-D natural breaks: minimize within-group squared deviation for up to
// four positive-count groups. Zero is separate; equal values are never split.
export function terrainBreaks(counts: number[]): number[] {
  const values = counts.filter(count => count > 0).sort((a, b) => a - b);
  const n = values.length;
  const groups = Math.min(4, new Set(values).size);
  if (!groups) return [];
  const sums = [0];
  const squares = [0];
  for (const value of values) {
    sums.push(sums[sums.length - 1] + value);
    squares.push(squares[squares.length - 1] + value * value);
  }
  const costs = Array.from({ length: groups + 1 }, () => Array<number>(n + 1).fill(Infinity));
  const starts = Array.from({ length: groups + 1 }, () => Array<number>(n + 1).fill(0));
  costs[0][0] = 0;
  for (let group = 1; group <= groups; group++) {
    for (let end = 1; end <= n; end++) {
      for (let start = 0; start < end; start++) {
        if (start > 0 && values[start - 1] === values[start]) continue;
        const sum = sums[end] - sums[start];
        const variance = Math.max(0, squares[end] - squares[start] - sum * sum / (end - start));
        const cost = costs[group - 1][start] + variance;
        if (cost < costs[group][end]) {
          costs[group][end] = cost;
          starts[group][end] = start;
        }
      }
    }
  }
  const breaks: number[] = [];
  let end = n;
  for (let group = groups; group > 0; group--) {
    breaks.unshift(values[end - 1]);
    end = starts[group][end];
  }
  return breaks;
}

export function terrainBand(count: number, breaks: number[]) {
  if (count <= 0 || breaks.length === 0) return 0;
  const index = breaks.findIndex(upper => count <= upper);
  return index < 0 ? breaks.length : index + 1;
}

export function terrainColor(count: number, breaks: number[]) {
  const band = terrainBand(count, breaks);
  return terrainColors[band === 0 ? 0 : Math.ceil(band * 4 / breaks.length)];
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
