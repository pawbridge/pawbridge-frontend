import type { AnimalStatusStats } from '../types/api.types';

// 선택 기간에 구조된 동물 전체(보호 중 포함)의 현재 상태 비율.
export function outcomeRates(stats?: AnimalStatusStats[]) {
  const total = stats?.reduce((sum, row) => sum + row.count, 0) ?? 0;
  if (!stats || !total) return null;
  const rate = (status: string) => ((stats.find(row => row.status === status)?.count ?? 0) / total * 100).toFixed(1);
  return { adoptionRate: rate('ADOPTED'), euthanasiaRate: rate('EUTHANIZED') };
}
