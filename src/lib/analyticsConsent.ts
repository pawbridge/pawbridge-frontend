export type AnalyticsConsent = 'granted' | 'denied';

export const ANALYTICS_CONSENT_STORAGE_KEY = 'pawbridge.analytics-consent.v1';
export const OPEN_ANALYTICS_CONSENT_EVENT = 'pawbridge:open-analytics-consent';

const sensitiveQueryKeys = new Set([
  'keyword',
  'breed',
  'noticeNo',
  'region',
  'city',
  'query',
  'search',
  'q',
]);

const privatePathPatterns = [
  /^\/admin(?:\/|$)/,
  /^\/(?:login|signup|reset-password|oauth\/callback)\/?$/,
  /^\/(?:mypage|favorite-animals|registered-animals|cart|checkout|order-complete|wishlist|orders)(?:\/|$)/,
  /^\/animals\/new\/?$/,
  /^\/animals\/[^/]+\/edit\/?$/,
  /^\/products\/new\/?$/,
  /^\/products\/[^/]+\/edit\/?$/,
  /^\/community\/new\/?$/,
  /^\/community\/[^/]+\/edit\/?$/,
  /^\/adoption\/new\/?$/,
  /^\/adoption\/[^/]+\/edit\/?$/,
];

const publicPathPatterns = [
  /^\/$/,
  /^\/animals(?:\/[^/]+)?\/?$/,
  /^\/shelters(?:\/[^/]+)?\/?$/,
  /^\/travel(?:\/[^/]+)?\/?$/,
  /^\/products(?:\/[^/]+)?\/?$/,
  /^\/community(?:\/[^/]+)?\/?$/,
  /^\/adoption(?:\/[^/]+)?\/?$/,
  /^\/privacy\/?$/,
];

export function readAnalyticsConsent(storage: Pick<Storage, 'getItem'> = localStorage): AnalyticsConsent | null {
  const value = storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return value === 'granted' || value === 'denied' ? value : null;
}

export function saveAnalyticsConsent(
  consent: AnalyticsConsent,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
}

export function isClarityTrackableLocation(pathname: string, search = ''): boolean {
  if (privatePathPatterns.some(pattern => pattern.test(pathname))) return false;
  if (!publicPathPatterns.some(pattern => pattern.test(pathname))) return false;

  const params = new URLSearchParams(search);
  return ![...params.keys()].some(key => sensitiveQueryKeys.has(key));
}

export function clarityPageType(pathname: string): string {
  if (pathname === '/') return 'home';
  const section = pathname.split('/').filter(Boolean)[0];
  return section || 'unknown';
}
