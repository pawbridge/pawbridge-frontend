import api from './client';
import type { PageResponse } from '../types/api.types';
import type { Shelter } from './shelter.api';
export interface PublicShelter extends Shelter {
  introduction?: string; adoptionProcedure?: string; email?: string;
  publicInformation?: { phone?: string; latitude?: number; longitude?: number;
    weekdayOpen?: string; weekdayClose?: string; weekendOpen?: string; weekendClose?: string;
    closedDays?: string; sourceUpdatedDate?: string; collectedAt?: string; };
}
export async function findPublicShelters(keyword: string, address: string, page: number, signal?: AbortSignal) {
  return (await api.get<PageResponse<Shelter>>('/api/shelters', {
    params: { keyword: keyword || undefined, address: address || undefined, page, size: 12, sort: 'name,asc' }, signal,
  })).data;
}
export async function findPublicShelter(registration: string, signal?: AbortSignal) {
  return (await api.get<PublicShelter>(`/api/shelters/by-care-reg-no/${encodeURIComponent(registration)}`, { signal })).data;
}
