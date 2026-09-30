import apiClient from './client';
import type { AnimalReportInput, AnimalReportResponse } from '../types/api.types';
import type { ReportSearch } from '../lib/reportSearch';

function payload(report: AnimalReportInput, photos: File[]) {
  const form = new FormData();
  form.append('report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
  photos.forEach((photo) => form.append('photos', photo));
  return form;
}

export async function createAnimalReport(report: AnimalReportInput, photos: File[]) {
  const response = await apiClient.post<{ data: AnimalReportResponse }>(
    '/api/reports', payload(report, photos), { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}

export async function updateAnimalReport(reportId: number, report: AnimalReportInput, photos: File[]) {
  const response = await apiClient.put<{ data: AnimalReportResponse }>(
    `/api/reports/${reportId}`, payload(report, photos), { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}

export async function getAnimalReport(reportId: number) {
  const response = await apiClient.get<{ data: AnimalReportResponse }>(`/api/reports/${reportId}`);
  return response.data.data;
}

export async function deleteAnimalReport(reportId: number) {
  await apiClient.delete(`/api/reports/${reportId}`);
}

export async function getAnimalReports(page: number, size: number, kind: 'MISSING' | 'SIGHTING', filters: ReportSearch) {
  const response = await apiClient.get<{ data: { content: AnimalReportResponse[]; totalPages: number } }>(
    '/api/reports', { params: { page, size, kind, keyword: filters.keyword || undefined,
      province: filters.province || undefined, district: filters.district || undefined,
      animalType: filters.animalType || undefined, from: filters.from || undefined, to: filters.to || undefined } },
  );
  return response.data.data;
}
