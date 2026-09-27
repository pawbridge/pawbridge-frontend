import { shelterSearch, shelterSearchParams } from '../lib/shelters.ts';

export function koreaToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validIntakeRange(from: string, to: string): boolean {
  return validDate(from) && validDate(to) && from <= to
    && (Date.parse(to) - Date.parse(from)) / 86_400_000 < 366;
}

export function readShelterDiscovery(params: URLSearchParams, today = koreaToday()) {
  const intakeFrom = params.get('intakeFrom') || '';
  const intakeTo = params.get('intakeTo') || '';
  const range = validIntakeRange(intakeFrom, intakeTo)
    ? { intakeFrom, intakeTo } : { intakeFrom: shiftDate(today, -29), intakeTo: today };
  return { ...shelterSearch(params), ...range };
}

export type ShelterDiscoveryFilters = ReturnType<typeof readShelterDiscovery>;

export function writeShelterDiscovery(filters: ShelterDiscoveryFilters): URLSearchParams {
  const params = shelterSearchParams(filters.keyword, filters.address, filters.page);
  params.set('intakeFrom', filters.intakeFrom);
  params.set('intakeTo', filters.intakeTo);
  return params;
}

export function shelterAnimalUrl(id: number, filters: ShelterDiscoveryFilters): string {
  const params = new URLSearchParams({ shelterId: String(id), status: 'PROTECT',
    intakeFrom: filters.intakeFrom, intakeTo: filters.intakeTo, sort: 'happenDate,desc',
    shelterReturnTo: `/shelters?${writeShelterDiscovery(filters)}` });
  return `/animals?${params}`;
}

export function shelterListReturnTo(value: string | null): string {
  return value === '/shelters' || value?.startsWith('/shelters?') ? value : '/shelters';
}

export function observationDays<T extends { date: string; protectedCount: number }>(from: string, to: string, points: T[]) {
  if (!validIntakeRange(from, to)) return [];
  const byDate = new Map(points.map(point => [point.date, point]));
  const days: { date: string; point: T | null }[] = [];
  for (let date = from; date <= to; date = shiftDate(date, 1)) days.push({ date, point: byDate.get(date) ?? null });
  return days;
}
