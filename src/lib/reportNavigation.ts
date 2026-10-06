import type { AnimalReportKind } from '../types/api.types';

export function reportListPath(kind: AnimalReportKind = 'MISSING') {
  return kind === 'SIGHTING' ? '/reports/sightings' : '/reports/missing';
}

export function legacyReportPath(pathname: string, search = '', hash = '') {
  return `${pathname.replace(/^\/community\/reports(?=\/|$)/, '/reports')}${search}${hash}`;
}

const returnKey = 'pawbridge-report-login-return';

// Only explicit report/contact destinations are accepted, never an arbitrary return URL.
export function validReportLoginReturn(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (/^\/reports\/(?:new(?:\?kind=(?:MISSING|SIGHTING))?|[1-9]\d*\/edit)$/.test(value)) return true;
  if (/^\/notes(?:\/blocks|\/[0-9a-f-]{36})?$/.test(value)) return true;
  if (!value.startsWith('/notes/new?')) return false;
  const params = new URLSearchParams(value.slice('/notes/new?'.length));
  if (!/^[1-9]\d*$/.test(params.get('to') || '')) return false;
  if ([...params.keys()].some(key => !['to', 'replyTo', 'context', 'contextId'].includes(key) || params.getAll(key).length !== 1)) return false;
  if (params.has('replyTo') && !/^[0-9a-f-]{36}$/i.test(params.get('replyTo') || '')) return false;
  if (params.has('context') !== params.has('contextId')) return false;
  return !params.has('context') || (['POST', 'REPORT'].includes(params.get('context') || '') && /^[1-9]\d*$/.test(params.get('contextId') || ''));
}

export function rememberReportLoginReturn(value: unknown) {
  try {
    if (validReportLoginReturn(value)) sessionStorage.setItem(returnKey, value);
    else sessionStorage.removeItem(returnKey);
  } catch { /* Login still works when browser storage is unavailable. */ }
}

export function consumeReportLoginReturn() {
  try {
    const value = sessionStorage.getItem(returnKey);
    sessionStorage.removeItem(returnKey);
    return validReportLoginReturn(value) ? value : '/';
  } catch { return '/'; }
}
