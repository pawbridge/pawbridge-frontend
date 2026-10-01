import { animalRegions } from '../utils/animalRegions.ts';

// Only report selectors include the 2026 Incheon districts. APMS selectors stay unchanged.
// https://www.incheon.go.kr/IC01070101
export const reportRegions = animalRegions.map(region => region.value === '인천광역시'
  ? { ...region, cities: [...region.cities, '제물포구', '영종구', '검단구'] }
  : region);
