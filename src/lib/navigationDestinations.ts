import type { NavigationDestination } from '../components/layout/NavigationGroup';

export const protectedAnimalDestinations: NavigationDestination[] = [
  { to: '/animals', title: '보호동물 검색', description: '보호 중인 동물을 조건별로 찾아보세요', current: path => path === '/animals' || /^\/animals\/(?!lost(?:\/|$)|stats(?:\/|$))/.test(path) },
  { to: '/shelters', title: '보호소 찾기', description: '지역별 보호소 정보를 확인하세요', current: path => path === '/shelters' || path.startsWith('/shelters/') },
  { to: '/animals/stats', title: '유기동물 현황', description: '전국 구조·보호·입양 현황을 살펴보세요', current: path => path === '/animals/stats' },
];

export const lostAnimalDestinations: NavigationDestination[] = [
  { to: '/reports/missing', title: '실종 알림', description: '잃어버린 우리 동물을 함께 찾아요', current: path => path === '/reports/missing' },
  { to: '/reports/sightings', title: '목격 제보', description: '목격한 동물의 위치와 특징을 나눠요', current: path => path === '/reports/sightings' },
  { to: '/animals/lost', title: '사진으로 찾기', description: '사진으로 닮은 보호동물을 찾아보세요', current: path => path === '/animals/lost' },
];
