import type { Animal } from '../types/api.types';

// 오늘 날짜 기준 계산
const today = new Date();
const getDateAfterDays = (days: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Mock 데이터 (APMS 공공데이터 형식)
export const mockAnimals: Animal[] = [
  {
    id: 1,
    name: '뭉치',
    species: 'DOG',
    breed: '믹스견',
    age: 3,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'SEOUL-2024-001234',
    noticeStartDate: getDateAfterDays(-10),
    noticeEndDate: getDateAfterDays(2), // D-2
    region: '서울',
    city: '강남구',
    foundPlace: '강남역 인근',
    shelterId: 1,
    shelterName: '서울시 동물보호센터',
    weight: 10,
    color: '갈색, 흰색',
    neutered: true,
    neuterStatus: 'YES',
    description: '사람을 매우 좋아하고 활발한 성격입니다. 산책을 좋아해요.',
    createdAt: getDateAfterDays(-10),
  },
  {
    id: 2,
    name: '나비',
    species: 'CAT',
    breed: '코리안 숏헤어',
    age: 2,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'BUSAN-2024-005678',
    noticeStartDate: getDateAfterDays(-5),
    noticeEndDate: getDateAfterDays(5), // D-5
    region: '부산',
    city: '해운대구',
    foundPlace: '해운대 해수욕장 근처',
    shelterId: 9,
    shelterName: '부산 동물사랑센터',
    weight: 3.5,
    color: '검은색',
    neutered: false,
    neuterStatus: 'NO',
    description: '조용하고 얌전한 성격이에요. 스킨십을 좋아합니다.',
    createdAt: getDateAfterDays(-5),
  },
  {
    id: 3,
    name: '초코',
    species: 'DOG',
    breed: '푸들',
    age: 5,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'INCHEON-2024-003456',
    noticeStartDate: getDateAfterDays(-15),
    noticeEndDate: getDateAfterDays(0), // D-DAY
    region: '인천',
    city: '남동구',
    foundPlace: '소래포구 인근',
    shelterId: 8,
    shelterName: '인천 유기동물보호소',
    weight: 5,
    color: '갈색',
    neutered: true,
    neuterStatus: 'YES',
    description: '작고 귀여워요. 다른 강아지들과도 잘 지냅니다.',
    createdAt: getDateAfterDays(-15),
  },
  {
    id: 4,
    name: '호두',
    species: 'DOG',
    breed: '시츄',
    age: 1,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'SEOUL-2024-007890',
    noticeStartDate: getDateAfterDays(-3),
    noticeEndDate: getDateAfterDays(7), // D-7
    region: '서울',
    city: '송파구',
    foundPlace: '잠실 롯데월드 근처',
    shelterId: 1,
    shelterName: '서울시 동물보호센터',
    weight: 4,
    color: '흰색, 갈색',
    neutered: false,
    neuterStatus: 'NO',
    description: '아직 어려서 매우 활발해요. 사회화 교육이 필요합니다.',
    createdAt: getDateAfterDays(-3),
  },
  {
    id: 5,
    name: '별이',
    species: 'CAT',
    breed: '러시안 블루',
    age: 4,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'ADOPTED',
    noticeNo: 'GYEONGGI-2024-002345',
    noticeStartDate: getDateAfterDays(-20),
    noticeEndDate: getDateAfterDays(-10),
    region: '경기',
    city: '성남시',
    foundPlace: '판교테크노밸리',
    shelterId: 2,
    shelterName: '경기도 동물보호센터',
    weight: 4,
    color: '회색',
    neutered: true,
    neuterStatus: 'YES',
    description: '조용하고 독립적인 성격입니다. 입양 완료되었어요!',
    createdAt: getDateAfterDays(-20),
  },
  {
    id: 6,
    name: '구름',
    species: 'CAT',
    breed: '페르시안',
    age: 3,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'DAEGU-2024-004567',
    noticeStartDate: getDateAfterDays(-8),
    noticeEndDate: getDateAfterDays(4), // D-4
    region: '대구',
    city: '수성구',
    foundPlace: '수성못 공원',
    shelterId: 3,
    shelterName: '대구 동물보호센터',
    weight: 5,
    color: '흰색',
    neutered: true,
    neuterStatus: 'YES',
    description: '고급스러운 장모종이에요. 털 관리가 필요합니다.',
    createdAt: getDateAfterDays(-8),
  },
  {
    id: 7,
    name: '콩이',
    species: 'DOG',
    breed: '웰시코기',
    age: 2,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'GWANGJU-2024-006789',
    noticeStartDate: getDateAfterDays(-12),
    noticeEndDate: getDateAfterDays(1), // D-1
    region: '광주',
    city: '서구',
    foundPlace: '광주천 산책로',
    shelterId: 4,
    shelterName: '광주 동물보호센터',
    weight: 12,
    color: '갈색, 흰색',
    neutered: false,
    neuterStatus: 'NO',
    description: '활발하고 에너지가 넘쳐요. 넓은 공간이 필요합니다.',
    createdAt: getDateAfterDays(-12),
  },
  {
    id: 8,
    name: '달이',
    species: 'CAT',
    breed: '벵갈',
    age: 1,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'DAEJEON-2024-008901',
    noticeStartDate: getDateAfterDays(-2),
    noticeEndDate: getDateAfterDays(10), // D-10
    region: '대전',
    city: '유성구',
    foundPlace: '카이스트 캠퍼스 근처',
    shelterId: 5,
    shelterName: '대전 유기동물보호센터',
    weight: 3,
    color: '갈색 얼룩무늬',
    neutered: false,
    neuterStatus: 'NO',
    description: '야생적인 무늬가 아름다워요. 활동적이고 호기심이 많습니다.',
    createdAt: getDateAfterDays(-2),
  },
  {
    id: 9,
    name: '바둑이',
    species: 'DOG',
    breed: '진돗개',
    age: 6,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'ULSAN-2024-009012',
    noticeStartDate: getDateAfterDays(-18),
    noticeEndDate: getDateAfterDays(-2), // 공고 종료 2일 지남
    region: '울산',
    city: '남구',
    foundPlace: '태화강 국가정원',
    shelterId: 6,
    shelterName: '울산 동물보호센터',
    weight: 18,
    color: '흰색',
    neutered: true,
    neuterStatus: 'YES',
    description: '충성스럽고 영리해요. 주인에게 한없이 헌신적입니다.',
    createdAt: getDateAfterDays(-18),
  },
  {
    id: 10,
    name: '치즈',
    species: 'CAT',
    breed: '스코티시 폴드',
    age: 2,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'ADOPTED',
    noticeNo: 'SEJONG-2024-001122',
    noticeStartDate: getDateAfterDays(-25),
    noticeEndDate: getDateAfterDays(-15),
    region: '세종',
    city: '세종시',
    foundPlace: '세종호수공원',
    shelterId: 7,
    shelterName: '세종시 동물보호센터',
    weight: 3.5,
    color: '크림색',
    neutered: true,
    neuterStatus: 'YES',
    description: '접힌 귀가 매력적이에요. 입양 완료되었습니다!',
    createdAt: getDateAfterDays(-25),
  },
  {
    id: 11,
    name: '복실이',
    species: 'DOG',
    breed: '포메라니안',
    age: 4,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'GYEONGGI-2024-003344',
    noticeStartDate: getDateAfterDays(-7),
    noticeEndDate: getDateAfterDays(3), // D-3
    region: '경기',
    city: '수원시',
    foundPlace: '수원 화성 행궁',
    shelterId: 2,
    shelterName: '경기도 동물보호센터',
    weight: 3,
    color: '오렌지색',
    neutered: true,
    neuterStatus: 'YES',
    description: '작고 귀여워요. 사람을 매우 좋아하고 애교가 많습니다.',
    createdAt: getDateAfterDays(-7),
  },
  {
    id: 12,
    name: '까망이',
    species: 'CAT',
    breed: '봄베이',
    age: 3,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'BUSAN-2024-005566',
    noticeStartDate: getDateAfterDays(-14),
    noticeEndDate: getDateAfterDays(6), // D-6
    region: '부산',
    city: '중구',
    foundPlace: '부산역 광장',
    shelterId: 9,
    shelterName: '부산 동물사랑센터',
    weight: 4.5,
    color: '검은색',
    neutered: true,
    neuterStatus: 'YES',
    description: '검은 표범 같은 외모예요. 차분하고 온순한 성격입니다.',
    createdAt: getDateAfterDays(-14),
  },
  {
    id: 13,
    name: '루비',
    species: 'DOG',
    breed: '비글',
    age: 3,
    gender: 'FEMALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'SEOUL-2024-009988',
    noticeStartDate: getDateAfterDays(-6),
    noticeEndDate: getDateAfterDays(8), // D-8
    region: '서울',
    city: '마포구',
    foundPlace: '상암 월드컵공원',
    shelterId: 1,
    shelterName: '서울시 동물보호센터',
    weight: 11,
    color: '갈색, 흰색, 검은색',
    neutered: false,
    neuterStatus: 'NO',
    description: '호기심이 많고 후각이 발달했어요. 산책을 매우 좋아합니다.',
    createdAt: getDateAfterDays(-6),
  },
  {
    id: 14,
    name: '토리',
    species: 'CAT',
    breed: '터키시 앙고라',
    age: 2,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'INCHEON-2024-007744',
    noticeStartDate: getDateAfterDays(-4),
    noticeEndDate: getDateAfterDays(9), // D-9
    region: '인천',
    city: '연수구',
    foundPlace: '송도 센트럴파크',
    shelterId: 8,
    shelterName: '인천 유기동물보호소',
    weight: 3.8,
    color: '흰색',
    neutered: true,
    neuterStatus: 'YES',
    description: '우아하고 긴 털을 가진 고양이예요. 조용한 환경을 좋아합니다.',
    createdAt: getDateAfterDays(-4),
  },
  {
    id: 15,
    name: '땅콩이',
    species: 'DOG',
    breed: '닥스훈트',
    age: 5,
    gender: 'MALE',
    imageUrl: '',
    status: 'PROTECT',
    noticeNo: 'GYEONGGI-2024-006655',
    noticeStartDate: getDateAfterDays(-11),
    noticeEndDate: getDateAfterDays(1), // D-1
    region: '경기',
    city: '고양시',
    foundPlace: '일산 호수공원',
    shelterId: 2,
    shelterName: '경기도 동물보호센터',
    weight: 7,
    color: '갈색',
    neutered: true,
    neuterStatus: 'YES',
    description: '짧은 다리가 귀여워요. 용감하고 충성스러운 성격입니다.',
    createdAt: getDateAfterDays(-11),
  },
];

// Mock API 함수 (페이지네이션 응답)
export const getMockAnimals = async (params?: {
  page?: number;
  size?: number;
  species?: string;
  status?: string;
}): Promise<import('../types/api.types').PageResponse<Animal>> => {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  
  // 필터링
  let filtered = [...mockAnimals];
  if (params?.species) {
    filtered = filtered.filter(a => a.species === params.species);
  }
  if (params?.status) {
    filtered = filtered.filter(a => a.status === params.status);
  }
  
  // 페이지네이션
  const start = page * size;
  const end = start + size;
  const content = filtered.slice(start, end);
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  
  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: {
        sorted: true,
        unsorted: false,
        empty: false,
      },
      offset: start,
      paged: true,
      unpaged: false,
    },
    totalPages,
    totalElements,
    last: page >= totalPages - 1,
    first: page === 0,
    numberOfElements: content.length,
    size,
    number: page,
    empty: content.length === 0,
  };
};

// D-day 계산 헬퍼 함수
export const calculateDday = (endDate: string): number => {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
