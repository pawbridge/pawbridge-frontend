import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicVisitPath, visitCountingEnabled, withVisitLock } from '../src/lib/visitBootstrap.ts';

test('공개 이용 경로만 집계하고 관리자·로그인·인증 콜백·없는 경로는 제외한다', () => {
  for (const path of ['/', '/animals', '/animals/123', '/reports/missing', '/travel/42', '/shelters']) assert.equal(isPublicVisitPath(path), true);
  for (const path of ['/admin', '/admin/statistics', '/login', '/oauth/callback', '/health', '/animals-other', '/animals/new', '/community/12/edit']) assert.equal(isPublicVisitPath(path), false);
});
test('운영 www와 명시적으로 켠 로컬 시험만 허용하며 Preview·개발은 운영 방문에 섞지 않는다', () => {
  assert.equal(visitCountingEnabled('prod', 'true', undefined, 'www.pawbridge.kr'), true);
  assert.equal(visitCountingEnabled('dev', 'true', undefined, 'dev.pawbridge.kr'), false);
  assert.equal(visitCountingEnabled('prod', 'true', undefined, 'preview.workers.dev'), false);
  assert.equal(visitCountingEnabled('prod', undefined, undefined, 'www.pawbridge.kr'), false);
  assert.equal(visitCountingEnabled('dev', 'true', 'true', '127.0.0.1'), true);
  assert.equal(visitCountingEnabled('dev', 'true', 'true', 'dev.pawbridge.kr'), false);
});
test('Web Lock 안에서 발급과 집계가 완료될 때까지 잠금을 유지한다', async () => {
  const events: string[] = [];
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async (_name: string, _options: object, run: () => Promise<string>) => {
    events.push('lock');
    const result = await run();
    events.push('unlock');
    return result;
  } } });
  assert.equal(await withVisitLock(async () => { events.push('identity'); await Promise.resolve(); events.push('count'); return 'done'; }), 'done');
  assert.deepEqual(events, ['lock', 'identity', 'count', 'unlock']);
  delete (navigator as Navigator & { locks?: LockManager }).locks;
});
test('Web Locks 권한 거부와 보조 저장소 차단을 사람 식별 대체나 방문 배제로 바꾸지 않는다', async () => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async () => {
    throw new DOMException('Unavailable', 'SecurityError');
  } } });
  let calls = 0;
  assert.equal(await withVisitLock(async () => { calls++; return 'cookie-only'; }), 'cookie-only');
  assert.equal(calls, 1);
  delete (navigator as Navigator & { locks?: LockManager }).locks;
});
