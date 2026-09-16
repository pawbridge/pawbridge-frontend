import type { AnimalSearchParams } from '../types/api.types';

export const defaultAnimalSearch = { page: 0, size: 21, sort: 'createdAt,desc' };
export const maxAnimalSearchResults = 10_000;
export const relevanceAnimalSearchSort = 'relevance,desc';
const textKeys = ['keyword', 'noticeNo', 'species', 'breed', 'gender', 'neuterStatus', 'status', 'region', 'city'] as const;
const numberKeys = ['page', 'size', 'minAge', 'maxAge', 'shelterId'] as const;
const sorts = [relevanceAnimalSearchSort, 'createdAt,desc', 'noticeEndDate,asc', 'age,asc'];

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
  const hasRelevanceTerms = Boolean(fields.keyword || fields.breed);
  if (sort && sorts.includes(sort) && (sort !== relevanceAnimalSearchSort || hasRelevanceTerms)) {
    fields.sort = sort;
  } else if (hasRelevanceTerms) {
    fields.sort = relevanceAnimalSearchSort;
  }
  return { ...defaultAnimalSearch, ...fields };
}

export function applyAnimalSearchFilters(
  current: AnimalSearchParams,
  next: AnimalSearchParams,
): AnimalSearchParams {
  const currentKeyword = current.keyword?.trim() || '';
  const nextKeyword = next.keyword?.trim() || '';
  const currentBreed = current.breed?.trim() || '';
  const nextBreed = next.breed?.trim() || '';
  const nextNoticeNo = next.noticeNo?.trim() || '';
  const hasRelevanceTerms = Boolean(nextKeyword || nextBreed);
  let sort = next.sort || defaultAnimalSearch.sort;

  if (hasRelevanceTerms && (nextKeyword !== currentKeyword || nextBreed !== currentBreed)) {
    sort = relevanceAnimalSearchSort;
  } else if (!hasRelevanceTerms && sort === relevanceAnimalSearchSort) {
    sort = defaultAnimalSearch.sort;
  }

  return {
    ...next,
    keyword: nextKeyword || undefined,
    noticeNo: nextNoticeNo || undefined,
    breed: nextBreed || undefined,
    sort,
    page: 0,
  };
}

export function hasAnimalRelevanceSearch(filters: AnimalSearchParams): boolean {
  return Boolean(filters.keyword?.trim() || filters.breed?.trim());
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

export function visibleAnimalSearchPages(totalPages: number, pageSize: number): number {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) return 0;
  return Math.min(totalPages, Math.floor(maxAnimalSearchResults / pageSize));
}
