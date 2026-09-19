import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSeoMetadata } from '../src/lib/seo.ts';

test('공개 핵심 화면은 고유한 메타데이터와 정규 URL로 색인을 허용한다', () => {
  const home = resolveSeoMetadata('/');
  const animals = resolveSeoMetadata('/animals');
  const shelters = resolveSeoMetadata('/shelters/611000020240001');

  assert.equal(home.robots, 'index,follow');
  assert.equal(animals.robots, 'index,follow');
  assert.notEqual(home.title, animals.title);
  assert.equal(shelters.canonicalUrl, 'https://www.pawbridge.kr/shelters/611000020240001');
  assert.equal(shelters.knownRoute, true);
});

test('검색과 필터가 포함된 중복 URL은 기본 목록을 canonical로 두고 색인하지 않는다', () => {
  const metadata = resolveSeoMetadata('/animals', '?keyword=흰색&page=2');

  assert.equal(metadata.robots, 'noindex,follow');
  assert.equal(metadata.canonicalUrl, 'https://www.pawbridge.kr/animals');
});

test('회원, 관리자, 작성과 수정 화면은 검색과 링크 추적을 모두 차단한다', () => {
  for (const pathname of [
    '/login',
    '/mypage',
    '/orders/1',
    '/admin/dashboard',
    '/animals/new',
    '/animals/1/edit',
    '/products/new',
    '/community/new',
    '/adoption/new',
  ]) {
    const metadata = resolveSeoMetadata(pathname);
    assert.equal(metadata.knownRoute, true, pathname);
    assert.equal(metadata.robots, 'noindex,nofollow', pathname);
  }
});

test('알 수 없는 경로는 실제 404 응답에 사용할 수 있도록 구분한다', () => {
  const metadata = resolveSeoMetadata('/does-not-exist');

  assert.equal(metadata.knownRoute, false);
  assert.equal(metadata.robots, 'noindex,nofollow');
  assert.match(metadata.title, /찾을 수 없습니다/);
});
