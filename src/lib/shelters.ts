export function shelterSearch(params: URLSearchParams) {
  const raw = params.get('page') ?? '0';
  const page = /^\d{1,6}$/.test(raw) ? Number(raw) : 0;
  return { keyword: (params.get('keyword') ?? '').slice(0, 100), address: (params.get('address') ?? '').slice(0, 100), page };
}
export function shelterSearchParams(keyword: string, address: string, page = 0) {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (address.trim()) params.set('address', address.trim());
  if (page > 0) params.set('page', String(page));
  return params;
}
export function shelterMapUrl(name: string, address?: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(address || name)}`;
}
export function shelterTelephone(phone?: string) {
  const value = phone?.replace(/[^+0-9]/g, '');
  return value && /^\+?\d{7,15}$/.test(value) ? `tel:${value}` : undefined;
}

export function isPublicShelterRequest(url: string, method?: string) {
  return (!method || method.toUpperCase() === 'GET') && /^\/api\/shelters(?:\/by-care-reg-no\/\d{15}|\/\d+)?(?:\?.*)?$/.test(url);
}
