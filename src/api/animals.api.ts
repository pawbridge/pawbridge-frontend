import apiClient from './client';
import type { Animal, PageResponse, AnimalSearchParams } from '../types/api.types';

export interface ChatbotMessageRequest {
  sessionId?: string;
  question: string;
}

export interface ChatbotMessageResponse {
  sessionId: string;
  answer: string;
  safetyNotice: string;
  provider: string;
}

type AnimalDetailResponse = Animal | WrappedResponse<Animal>;

type WrappedResponse<T> = {
  code?: number;
  data: T;
  message?: string;
};

const unwrapResponse = <T>(responseData: T | WrappedResponse<T>): T => {
  if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    responseData.data !== undefined
  ) {
    return responseData.data as T;
  }

  return responseData as T;
};

// 동물 목록 조회 (페이지네이션, 필터링, 정렬)
export const getAnimals = async (params?: AnimalSearchParams): Promise<PageResponse<Animal>> => {
  const response = await apiClient.get<PageResponse<Animal>>('/api/animals', {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
      sort: params?.sort ?? 'createdAt,desc',
      ...(params?.species && { species: params.species }),
      ...(params?.breed && { breed: params.breed }),
      ...(params?.gender && { gender: params.gender }),
      ...(params?.neuterStatus && { neuterStatus: params.neuterStatus }),
      ...(params?.status && { status: params.status }),
      ...(params?.minAge && { minAge: params.minAge }),
      ...(params?.maxAge && { maxAge: params.maxAge }),
      ...(params?.region && { region: params.region }),
      ...(params?.city && { city: params.city }),
      ...(params?.keyword && { keyword: params.keyword }),
      ...(params?.shelterId && { shelterId: params.shelterId }),
    },
  });
  return response.data;
};

// 동물 상세 조회
export const getAnimalById = async (id: number): Promise<Animal> => {
  const response = await apiClient.get<AnimalDetailResponse>(`/api/animals/${id}`);
  console.log('getAnimalById 전체 응답:', response);
  console.log('getAnimalById response.data:', response.data);
  
  // 응답 구조 확인: { code, data, message } 형식이거나 직접 Animal 형식일 수 있음
  const responseData = response.data;
  
  // { code, data, message } 형식인 경우
  if (responseData && typeof responseData === 'object' && 'code' in responseData && 'data' in responseData) {
    console.log('응답 형식: { code, data, message }');
    return responseData.data;
  }
  
  // 직접 Animal 객체인 경우
  if (responseData && typeof responseData === 'object' && 'id' in responseData) {
    console.log('응답 형식: 직접 Animal 객체');
    return responseData;
  }
  
  // 예상치 못한 형식
  console.error('예상치 못한 응답 형식:', responseData);
  throw new Error('예상치 못한 API 응답 형식입니다.');
};

// 동물 찜하기
export const addFavorite = async (animalId: number): Promise<{ favoriteId: number }> => {
  const response = await apiClient.post<{ code: number; data: { favoriteId: number }; message: string }>(
    `/api/favorites/${animalId}`
  );
  return response.data.data;
};

// 동물 찜 제거
export const removeFavorite = async (animalId: number): Promise<void> => {
  await apiClient.delete<{ code: number; data: null; message: string }>(`/api/favorites/${animalId}`);
};

// 찜 여부 확인
export const checkFavorite = async (animalId: number): Promise<boolean> => {
  const response = await apiClient.get<{ code: number; data: boolean; message: string }>(
    `/api/favorites/${animalId}/check`
  );
  return response.data.data;
};

// 동물 등록 요청 타입
// 명세서 기준: careRegNo를 사용 (shelterId 아님)
export interface CreateAnimalRequest {
  careRegNo: string; // 필수: 보호소 등록번호 (/api/users/me에서 획득)
  species: 'DOG' | 'CAT' | 'ETC';
  status: 'PROTECT' | 'ADOPTION_PENDING' | 'ADOPTED' | 'EUTHANIZED' | 'NATURAL_DEATH' | 'RETURNED' | 'DONATED' | 'RELEASED' | 'ESCAPED' | 'UNKNOWN';
  noticeStartDate: string; // 필수: 공고 시작일 (YYYY-MM-DD)
  noticeEndDate: string; // 필수: 공고 종료일 (YYYY-MM-DD)
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN'; // 필수: 성별
  neuterStatus: 'YES' | 'NO' | 'UNKNOWN'; // 필수: 중성화 여부 (명세서: YES, NO, UNKNOWN)
  apmsNoticeNo?: string; // 선택: 공고번호 (미입력 시 자동 생성)
  apiSource?: 'APMS_ANIMAL' | 'MANUAL'; // 선택: 데이터 출처 (미입력 시 MANUAL)
  breed?: string;
  birthYear?: number;
  weight?: string;
  color?: string;
  specialMark?: string;
  happenDate?: string; // 발견 일자
  happenPlace?: string; // 발견 장소
  imageUrl?: string;
  imageUrl2?: string;
  description?: string;
}

// 동물 등록
export const createAnimal = async (animalData: CreateAnimalRequest): Promise<Animal> => {
  const response = await apiClient.post<Animal>('/api/animals', animalData);
  return response.data;
};

// 동물 수정 요청 타입 (등록과 동일하지만 id는 URL에 포함)
export type UpdateAnimalRequest = Omit<CreateAnimalRequest, 'careRegNo'> & {
  careRegNo?: string; // 수정 시에는 선택적
};

// 동물 수정
export const updateAnimal = async (id: number, animalData: UpdateAnimalRequest): Promise<Animal> => {
  const response = await apiClient.put<Animal>(`/api/animals/${id}`, animalData);
  return response.data;
};

// 이미지 업로드 응답 타입
export interface AnimalImageUploadResponse {
  imageUrl: string;
}

// 다중 이미지 업로드 응답 타입
export interface AnimalImagesUploadResponse {
  imageUrls: string[];
  count: number;
}

// 단일 이미지 업로드
export const uploadAnimalImage = async (file: File): Promise<AnimalImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<{
    code?: number;
    data?: AnimalImageUploadResponse;
    message?: string;
    imageUrl?: string; // 직접 응답인 경우
  }>(
    '/api/animals/images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  console.log('이미지 업로드 원본 응답:', response.data);
  
  // 응답 구조 확인: 래핑되어 있으면 data.imageUrl, 아니면 직접 imageUrl
  if (response.data.data && response.data.data.imageUrl) {
    console.log('래핑된 응답에서 imageUrl 추출:', response.data.data.imageUrl);
    return response.data.data;
  } else if (response.data.imageUrl) {
    console.log('직접 응답에서 imageUrl 추출:', response.data.imageUrl);
    return { imageUrl: response.data.imageUrl };
  } else {
    console.error('이미지 업로드 응답 구조:', response.data);
    throw new Error('이미지 업로드 응답 형식이 올바르지 않습니다. 응답: ' + JSON.stringify(response.data));
  }
};

// 다중 이미지 업로드
export const uploadAnimalImages = async (files: File[]): Promise<AnimalImagesUploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  const response = await apiClient.post<AnimalImagesUploadResponse>(
    '/api/animals/images/multiple',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// 유사 동물 목록 조회
export const getSimilarAnimals = async (id: number): Promise<Animal[]> => {
  const response = await apiClient.get<Animal[] | { code: number; data: Animal[]; message: string }>(
    `/api/animals/${id}/similar`
  );
  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
};

// 챗봇 메시지 전송
export const sendAnimalChatbotMessage = async (
  animalId: number,
  request: ChatbotMessageRequest
): Promise<ChatbotMessageResponse> => {
  const response = await apiClient.post<ChatbotMessageResponse | WrappedResponse<ChatbotMessageResponse>>(
    `/api/animals/${animalId}/chat/messages`,
    request,
    {
      withCredentials: true,
    }
  );

  return unwrapResponse(response.data);
};

// 이미지 삭제
export const deleteAnimalImage = async (imageUrl: string): Promise<void> => {
  await apiClient.delete('/api/animals/images', {
    params: { imageUrl },
  });
};
