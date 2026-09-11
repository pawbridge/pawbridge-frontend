import type { AnimalSearchParams } from '../types/api.types';

export const defaultAnimalSearch = { page: 0, size: 21, sort: 'createdAt,desc' };
const textKeys = ['keyword', 'species', 'breed', 'gender', 'neuterStatus', 'status', 'region', 'city'] as const;
const numberKeys = ['page', 'size', 'minAge', 'maxAge', 'shelterId'] as const;
const sorts = ['createdAt,desc', 'noticeEndDate,asc', 'age,asc'];

export function readAnimalSearch(params: URLSearchParams): AnimalSearchParams {
  const fields: Record<string, string | number> = {};
  for (const key of textKeys) {
    const value = params.get(key);
    if (value) fields[key] = value;
  }
  for (const key of numberKeys) {
    const raw = params.get(key);
    if (!raw || !/^\d+$/.test(raw)) continue;
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) continue;
    if ((key === 'size' || key === 'shelterId') && value === 0) continue;
    if (key === 'size' && value > 100) continue;
    fields[key] = value;
  }
  const sort = params.get('sort');
  if (sort && sorts.includes(sort)) fields.sort = sort;
  return { ...defaultAnimalSearch, ...fields };
}

export function writeAnimalSearch(filters: AnimalSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of [...textKeys, ...numberKeys, 'sort'] as const) {
    const value = filters[key];
    if (value === undefined || value === '') continue;
    if (key in defaultAnimalSearch && value === defaultAnimalSearch[key as keyof typeof defaultAnimalSearch]) continue;
    params.set(key, String(value));
  }
  return params;
}

export function animalSearchReturnTo(value: unknown): string {
  return typeof value === 'string' && (value === '/animals' || value.startsWith('/animals?')) ? value : '/animals';
}
