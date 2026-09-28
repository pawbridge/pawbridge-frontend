import apiClient from './client';
import type { AnimalReportInput, AnimalReportResponse } from '../types/api.types';

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

export async function updateAnimalReport(postId: number, report: AnimalReportInput, photos: File[]) {
  const response = await apiClient.put<{ data: AnimalReportResponse }>(
    `/api/reports/${postId}`, payload(report, photos), { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}

export async function getAnimalReport(postId: number) {
  const response = await apiClient.get<{ data: AnimalReportResponse }>(`/api/reports/${postId}`);
  return response.data.data;
}

export async function getAnimalReports(page: number, size: number) {
  const response = await apiClient.get<{ data: { content: AnimalReportResponse[]; totalPages: number } }>(
    '/api/reports', { params: { page, size } },
  );
  return response.data.data;
}
