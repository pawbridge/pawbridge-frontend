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

test('실종 제보 상세는 알려진 경로지만 출시 전에는 색인하지 않는다', () => {
  const detail = resolveSeoMetadata('/community/reports/42');
  assert.equal(detail.knownRoute, true);
  assert.equal(detail.robots, 'noindex,follow');
  assert.equal(detail.canonicalUrl, 'https://www.pawbridge.kr/community/reports/42');

  for (const path of ['/community/reports/new', '/community/reports/42/edit']) {
    const privatePage = resolveSeoMetadata(path);
    assert.equal(privatePage.knownRoute, true);
    assert.equal(privatePage.robots, 'noindex,nofollow');
  }
});

test('전용 제보 목록과 상세는 기존 색인 제한을 유지하고 작성·수정은 비공개로 취급한다', () => {
  for (const path of ['/reports/missing', '/reports/sightings', '/reports/42']) {
    const page = resolveSeoMetadata(path);
    assert.equal(page.knownRoute, true, path);
    assert.equal(page.robots, 'noindex,follow', path);
    assert.equal(page.canonicalUrl, `https://www.pawbridge.kr${path}`);
  }
  for (const path of ['/reports/new', '/reports/42/edit']) {
    assert.equal(resolveSeoMetadata(path).robots, 'noindex,nofollow', path);
  }
  assert.notEqual(resolveSeoMetadata('/reports/missing').title, resolveSeoMetadata('/reports/sightings').title);
});

test('동물 목록에서 시도 하나만 고른 주소는 지역 이름으로 색인한다', () => {
  const region = resolveSeoMetadata('/animals', '?region=부산광역시');

  assert.equal(region.robots, 'index,follow');
  assert.equal(region.title, '부산광역시 보호 동물 - 포우브릿지');
  assert.match(region.description, /^부산광역시 동물보호소에서/);
  assert.equal(region.canonicalUrl, `https://www.pawbridge.kr/animals?region=${encodeURIComponent('부산광역시')}`);
  assert.equal(resolveSeoMetadata('/animals/', `?region=${encodeURIComponent('제주특별자치도')}`).robots, 'index,follow');
});

test('지역 말고 다른 조건이 붙거나 목록에 없는 지역이면 지금처럼 색인하지 않는다', () => {
  for (const search of ['?region=부산광역시&city=해운대구', '?region=부산광역시&page=1', '?region=부산', '?region=없는도', '?region=', '?region=부산광역시&region=경기도', '?city=해운대구']) {
    const metadata = resolveSeoMetadata('/animals', search);
    assert.equal(metadata.robots, 'noindex,follow', search);
    assert.equal(metadata.canonicalUrl, 'https://www.pawbridge.kr/animals', search);
    assert.equal(metadata.title, '보호 동물 검색 - 포우브릿지', search);
  }
  assert.equal(resolveSeoMetadata('/shelters', '?region=부산광역시').robots, 'noindex,follow');
});
