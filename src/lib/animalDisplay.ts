export function animalStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PROTECT: '보호 중', ADOPTION_PENDING: '입양 대기', ADOPTED: '종료 (입양)',
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
