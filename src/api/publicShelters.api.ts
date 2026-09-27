import api from './client';
import type { PageResponse } from '../types/api.types';
import type { Shelter } from './shelter.api';
import type { ShelterDiscoveryFilters } from '../utils/shelterDiscovery';

export interface ShelterAnimalPreview {
  id: number; breed: string | null; species: string; gender: string;
  birthYear: number | null; imageUrl: string | null; happenDate: string;
}
export interface ShelterDiscovery {
  id: number; careRegNo: string; name: string; address: string | null; phone: string | null;
  protectedCount: number; animals: ShelterAnimalPreview[];
}
export interface ShelterObservation { date: string; observedAt: string; protectedCount: number }

export async function discoverShelters(filters: ShelterDiscoveryFilters, signal?: AbortSignal) {
  return (await api.get<PageResponse<ShelterDiscovery>>('/api/shelters/discovery', {
    params: { ...filters, size: 12 }, signal,
  })).data;
}
export async function shelterObservations(id: number, from: string, to: string, signal?: AbortSignal) {
  return (await api.get<ShelterObservation[]>(`/api/shelters/${id}/observations`, { params: { from, to }, signal })).data;
}
export async function publicShelterById(id: number, signal?: AbortSignal) {
  return (await api.get<PublicShelter>(`/api/shelters/${id}`, { signal })).data;
}
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
