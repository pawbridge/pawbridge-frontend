// Provider legal-district codes include five-digit Sejong; membership comes from the regions API.
export function travelConditionsNotice(status: string, available: boolean): string | null {
  if (status === 'PREPARING') return '동반 조건 확인 중입니다. 기본 장소 정보를 먼저 제공하고 있어요.';
  if (status === 'FAILED') return '동반 조건을 아직 확보하지 못했습니다. 방문 전 운영처에 확인해 주세요.';
  if (status === 'STALE') return '동반 조건을 다시 확인 중입니다. 기존 안내와 현재 조건이 다를 수 있어요.';
  return available ? null : '제공된 동반 조건 정보가 없습니다. 방문 전 운영처에 확인해 주세요.';
}

export const isTravelRegionCode = (value: string): boolean => value.length >= 2 && value.length <= 5 && !/[^0-9]/.test(value);
export const isTravelContentId = (value: string): boolean => value.length >= 1 && value.length <= 20 && !/[^0-9]/.test(value);

// Only the three public GET routes bypass the shared client's login redirect.
export function isPublicTravelRequest(url: string, method?: string): boolean {
  return method?.toLowerCase() === 'get'
    && !/[\r\n]/.test(url)
    && /^\/api\/places(?:\/regions|\/[0-9]{1,20})?(?:\?[^#]*)?$/.test(url);
}

export function travelListPath(areaCode: string): string {
  return isTravelRegionCode(areaCode) ? `/travel?areaCode=${areaCode}` : '/travel';
}

export function travelImageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'tong.visitkorea.or.kr'
      && !url.username && !url.password && !url.port && !url.search && !url.hash
      && /^\/cms\/resource\/[0-9]+\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/.test(url.pathname)
      ? url.href : null;
  } catch {
    return null;
  }
}

// TourAPI descriptions may contain line breaks encoded as markup. Never render HTML.
export function travelText(value: string | null): string {
  return (value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').trim();
}
