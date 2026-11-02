// 브라우저가 보내는 CSP 위반 보고를 받아 요약만 Workers Logs에 남긴다.
// 강제 CSP로 바꾸기 전에 실제 방문자에게서 어떤 출처가 막히는지 모으는 용도다.
// 보고는 누구나 보낼 수 있으므로 크기를 제한하고, 주소의 쿼리·조각은 남기지 않는다.

export const CSP_REPORT_PATH = '/csp-report';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT = 120;

export interface CspViolation {
  directive: string;
  blocked: string;
  page: string;
  source: string;
  line: number | null;
  disposition: string;
}

type Fields = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, MAX_TEXT) : '';
}

// http(s) 주소는 출처만 남긴다. inline·eval·data 같은 키워드는 그대로 둔다.
function blockedOrigin(value: unknown): string {
  const raw = text(value);
  try {
    const url = new URL(raw);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'wss:' || url.protocol === 'ws:') {
      return url.origin;
    }
    return url.protocol.replace(/:$/, '');
  } catch {
    return raw;
  }
}

function pathOnly(value: unknown): string {
  try {
    return new URL(text(value)).pathname;
  } catch {
    return '';
  }
}

function sourceFile(value: unknown): string {
  try {
    const url = new URL(text(value));
    return url.origin + url.pathname;
  } catch {
    return '';
  }
}

function lineNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// report-uri 형식({"csp-report": {...}})만 받는다. report-to(Reporting API)를 같이 선언하면
// Chrome이 report-uri를 무시하는데, 로컬 Chrome 시험에서 report-to 보고는 100초 안에 오지 않았다.
export function summarizeCspReport(payload: unknown): CspViolation | null {
  if (!isFields(payload) || !isFields(payload['csp-report'])) return null;
  const fields = payload['csp-report'];
  const effective = text(fields['effective-directive']);
  return {
    // 예전 브라우저는 violated-directive에 정책 문장 전체를 담기도 한다. 첫 단어만 지시어다.
    directive: effective || text(fields['violated-directive']).split(' ')[0],
    blocked: blockedOrigin(fields['blocked-uri']),
    page: pathOnly(fields['document-uri']),
    source: sourceFile(fields['source-file']),
    line: lineNumber(fields['line-number']),
    disposition: text(fields.disposition),
  };
}

export async function receiveCspReport(request: Request, environment: string | undefined): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  const violation = summarizeCspReport(payload);
  if (violation) {
    console.log(JSON.stringify({ event: 'csp-violation', environment: environment ?? 'unknown', ...violation }));
  }
  return new Response(null, { status: 204 });
}
