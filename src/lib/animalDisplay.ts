export function animalStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PROTECT: '보호 중', ADOPTION_PENDING: '입양 대기', ADOPTED: '입양 완료',
    EUTHANIZED: '종료 (안락사)', NATURAL_DEATH: '종료 (자연사)',
    RETURNED: '종료 (반환)', DONATED: '종료 (기증)', RELEASED: '종료 (방사)',
    ESCAPED: '탈출', UNKNOWN: '상태 미상', DELETED: '정보 없음',
    AVAILABLE: '보호 중', RESERVED: '입양 대기', UNAVAILABLE: '종료',
  };
  return status ? labels[status] ?? status : '상태 미상';
}

export function animalSpeciesLabel(species?: string | null) {
  return species === 'DOG' ? '개' : species === 'CAT' ? '고양이' : species === 'ETC' ? '기타' : species || '종 정보 없음';
}

export function animalGenderLabel(gender?: string | null) {
  return gender === 'MALE' || gender === 'M' || gender === '수컷' ? '수컷'
    : gender === 'FEMALE' || gender === 'F' || gender === '암컷' ? '암컷' : '미상';
}

export function animalAgeLabel(age?: number | null) {
  return age == null ? '정보 없음' : age === 0 ? '1세 미만' : `${age}세`;
}

export function animalWeightLabel(weight?: string | null): string | null {
  const value = weight?.trim();
  if (!value) return null;
  return /^\d+(?:\.\d+)?$/.test(value) ? `${value} kg` : value;
}

// 공고 마감까지 남은 날. 시각은 보지 않고 날짜만 세서, 마감일 당일은 D-DAY, 지난 공고는 null이다.
// 마감일 23:59:59에서 지금 시각을 빼고 올림하면 오후에 하루가 더 붙어 카드와 상세가 달라졌다.
export function noticeDday(endDate?: string | null, now = new Date()): string | null {
  const match = endDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((end - today) / 86_400_000);
  if (days < 0) return null;
  return days === 0 ? 'D-DAY' : `D-${days}`;
}
