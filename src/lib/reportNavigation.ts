import type { AnimalReportKind } from '../types/api.types';

export function reportListPath(kind: AnimalReportKind = 'MISSING') {
  return kind === 'SIGHTING' ? '/reports/sightings' : '/reports/missing';
}

export function legacyReportPath(pathname: string, search = '', hash = '') {
  return `${pathname.replace(/^\/community\/reports(?=\/|$)/, '/reports')}${search}${hash}`;
}

const returnKey = 'pawbridge-report-login-return';

// Only report writing destinations are accepted, never an arbitrary return URL.
export function validReportLoginReturn(value: unknown): value is string {
  return typeof value === 'string'
    && /^\/reports\/(?:new(?:\?kind=(?:MISSING|SIGHTING))?|[1-9]\d*\/edit)$/.test(value);
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
