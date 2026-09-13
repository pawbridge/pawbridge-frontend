import api from './client';
import type { PageResponse } from '../types/api.types';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ShelterApplication { id: number; userId: number; shelterName: string; status: ApplicationStatus; requestedAt: string; reviewedAt: string | null; reason: string | null; careRegNo: string | null; }
export interface AdminApplication { application: ShelterApplication; applicantName: string; applicantEmail: string | null; reviewNote: string | null; }
export interface Shelter { id: number; careRegNo: string; name: string; address?: string; phone?: string; organizationName?: string; operatingHours?: string; }
export interface ShelterMember { userId: number; name: string; email: string; approvalApplicationId: number | null; }
interface Envelope<T> { data: T; }
const applications = '/api/admin/users/shelter-applications';
export const getMyApplications = async (page = 0) => (await api.get<Envelope<PageResponse<ShelterApplication>>>('/api/users/me/shelter-applications', { params: { page, size: 10 } })).data.data;
export const submitApplication = async (shelterName: string) => (await api.post<Envelope<ShelterApplication>>('/api/users/me/shelter-applications', { shelterName })).data.data;
export const getApplications = async (status: ApplicationStatus | '', page: number) => (await api.get<Envelope<PageResponse<AdminApplication>>>(applications, { params: { status: status || undefined, page, size: 20 } })).data.data;
export const getApplication = async (id: number) => (await api.get<Envelope<AdminApplication>>(`${applications}/${id}`)).data.data;
export const approveApplication = async (id: number, careRegNo: string, note: string) => (await api.post<Envelope<AdminApplication>>(`${applications}/${id}/approve`, { careRegNo, note })).data.data;
export const rejectApplication = async (id: number, reason: string) => (await api.post<Envelope<AdminApplication>>(`${applications}/${id}/reject`, { reason })).data.data;
export const getShelters = async (keyword: string, page: number) => (await api.get<PageResponse<Shelter>>('/api/shelters', { params: { keyword: keyword || undefined, page, size: 20 } })).data;
export const getShelter = async (registration: string) => (await api.get<Shelter>(`/api/shelters/by-care-reg-no/${encodeURIComponent(registration)}`)).data;
export const getShelterMembers = async (registration: string, page: number) => (await api.get<Envelope<PageResponse<ShelterMember>>>(`/api/admin/users/shelters/${encodeURIComponent(registration)}/members`, { params: { page, size: 20 } })).data.data;
