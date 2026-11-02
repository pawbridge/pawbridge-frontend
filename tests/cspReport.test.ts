import assert from 'node:assert/strict';
import test from 'node:test';
import { receiveCspReport, summarizeCspReport } from '../worker/cspReport.ts';

const report = {
  'csp-report': {
    'document-uri': 'https://www.pawbridge.kr/shelters/1?returnTo=%2Fshelters%3Fq%3Dprivate#top',
    'violated-directive': 'img-src',
    'effective-directive': 'img-src',
    'blocked-uri': 'https://images.unsplash.com/photo-1?w=400&token=abc',
    'source-file': 'https://www.pawbridge.kr/assets/index-abc.js?v=1',
    'line-number': 12,
    disposition: 'report',
  },
};

function post(body: string, headers: Record<string, string> = {}) {
  return new Request('https://www.pawbridge.kr/csp-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/csp-report', ...headers },
    body,
  });
}

test('report-uri 보고는 출처와 경로만 남기고 쿼리·조각을 버린다', () => {
  assert.deepEqual(summarizeCspReport(report), {
    directive: 'img-src',
    blocked: 'https://images.unsplash.com',
    page: '/shelters/1',
    source: 'https://www.pawbridge.kr/assets/index-abc.js',
    line: 12,
    disposition: 'report',
  });
});

test('inline 같은 키워드는 그대로 두고, 지시어가 정책 문장이면 첫 단어만 쓴다', () => {
  const summary = summarizeCspReport({
    'csp-report': { 'document-uri': 'https://www.pawbridge.kr/', 'violated-directive': "script-src 'self'", 'blocked-uri': 'inline' },
  });
  assert.equal(summary?.directive, 'script-src');
  assert.equal(summary?.blocked, 'inline');
  assert.equal(summary?.line, null);
});

test('data 주소는 출처 대신 scheme만 남긴다', () => {
  const summary = summarizeCspReport({
    'csp-report': { 'document-uri': 'https://www.pawbridge.kr/', 'effective-directive': 'img-src', 'blocked-uri': 'data:image/png;base64,AAAA' },
  });
  assert.equal(summary?.blocked, 'data');
});

test('보고 형식이 아니면 남기지 않는다', () => {
  assert.equal(summarizeCspReport([{ type: 'csp-violation', body: {} }]), null);
  assert.equal(summarizeCspReport({ other: true }), null);
  assert.equal(summarizeCspReport(null), null);
});

test('보고를 받으면 요약 한 줄을 남기고 204로 답한다', async (t) => {
  const logged: string[] = [];
  t.mock.method(console, 'log', (line: string) => { logged.push(line); });
  const response = await receiveCspReport(post(JSON.stringify(report)), 'prod');
  assert.equal(response.status, 204);
  assert.equal(logged.length, 1);
  const line = JSON.parse(logged[0]);
  assert.equal(line.event, 'csp-violation');
  assert.equal(line.environment, 'prod');
  assert.equal(line.blocked, 'https://images.unsplash.com');
  assert.ok(!logged[0].includes('token'));
  assert.ok(!logged[0].includes('private'));
});

test('POST가 아니거나, 너무 크거나, JSON이 아니면 남기지 않는다', async (t) => {
  const logged: string[] = [];
  t.mock.method(console, 'log', (line: string) => { logged.push(line); });
  const get = await receiveCspReport(new Request('https://www.pawbridge.kr/csp-report'), 'prod');
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('Allow'), 'POST');
  assert.equal((await receiveCspReport(post('{}', { 'Content-Length': '20000' }), 'prod')).status, 413);
  assert.equal((await receiveCspReport(post('x'.repeat(17 * 1024)), 'prod')).status, 413);
  assert.equal((await receiveCspReport(post('not json'), 'prod')).status, 400);
  assert.equal(logged.length, 0);
});
