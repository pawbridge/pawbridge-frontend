import type { AnimalSearchParams } from '../types/api.types';
import { validIntakeRange } from './shelterDiscovery.ts';

export const shelterAnimalPageSize = 12;
// The public search contract rejects offset + size above 10,000.
export const maxShelterAnimalPages = Math.floor(10_000 / shelterAnimalPageSize);
export const shelterAnimalSorts = ['happenDate,desc', 'happenDate,asc', 'createdAt,desc'] as const;
export const shelterSpecies = ['', 'DOG', 'CAT', 'ETC'] as const;
export interface ShelterAnimalFilters {
  page: number;
  species: typeof shelterSpecies[number];
  sort: typeof shelterAnimalSorts[number];
  intakeFrom?: string;
  intakeTo?: string;
}

export function readShelterAnimals(params: URLSearchParams): ShelterAnimalFilters {
  const rawPage = params.get('page') || '0';
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 0;
  const species = params.get('species');
  const sort = params.get('sort');
  const from = params.get('intakeFrom') || '';
  const to = params.get('intakeTo') || '';
  return {
    page: Math.min(page, maxShelterAnimalPages - 1),
    species: shelterSpecies.find(value => value === species) || '',
    sort: shelterAnimalSorts.find(value => value === sort) || shelterAnimalSorts[0],
    ...(validIntakeRange(from, to) ? { intakeFrom: from, intakeTo: to } : {}),
  };
}

export function writeShelterAnimals(params: URLSearchParams, filters: ShelterAnimalFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of ['page', 'species', 'sort', 'intakeFrom', 'intakeTo'] as const) next.delete(key);
  if (filters.page > 0) next.set('page', String(filters.page));
  if (filters.species) next.set('species', filters.species);
  if (filters.sort !== shelterAnimalSorts[0]) next.set('sort', filters.sort);
  if (filters.intakeFrom && filters.intakeTo) {
    next.set('intakeFrom', filters.intakeFrom);
    next.set('intakeTo', filters.intakeTo);
  }
  return next;
}

export function shelterAnimalRequest(id: number, filters: ShelterAnimalFilters): AnimalSearchParams {
  return { ...filters, species: filters.species || undefined, shelterId: id, status: 'PROTECT', size: shelterAnimalPageSize };
}

export function shelterPageCount(totalPages: number): number {
  return Math.min(Math.max(0, totalPages), maxShelterAnimalPages);
}

export function shelterLastValidPage(page: number, totalPages: number): number {
  return Math.min(page, Math.max(0, shelterPageCount(totalPages) - 1));
}

export function shelterDetailReturnTo(value: unknown): string {
  if (typeof value !== 'string') return '/shelters';
  return /^\/(?:shelters|animals)(?:\?[^#]*)?$/.test(value)
    || /^\/animals\/[1-9]\d*(?:\?[^#]*)?$/.test(value) ? value : '/shelters';
}

export function shelterDetailPath(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/shelters\/\d{15}(?:\?[^#]*)?$/.test(value) ? value : undefined;
}

// 돌아갈 화면은 주소 대신 화면 이동 정보(state의 shelterReturnTo)로 넘긴다.
// 주소에 넣으면 같은 보호소가 출발 화면마다 다른 주소가 되어, 구글이 noindex 주소를 1,000개 넘게 수집했다.
export function shelterDetailUrl(registration: string): string {
  return `/shelters/${encodeURIComponent(registration)}`;
}
