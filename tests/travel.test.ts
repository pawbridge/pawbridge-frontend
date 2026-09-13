import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTravelRegionCode, isTravelContentId, isPublicTravelRequest, travelListPath, travelImageUrl, travelText, travelFetchTime, travelConditionsNotice } from '../src/lib/travel.ts';

test('condition notices distinguish uncollected, failed, stale and successfully empty data', () => {
  assert.match(travelConditionsNotice('PREPARING', false) ?? '', /확인 중/);
  assert.match(travelConditionsNotice('FAILED', false) ?? '', /확보하지 못/);
  assert.match(travelConditionsNotice('STALE', true) ?? '', /기존 안내/);
  assert.match(travelConditionsNotice('READY', false) ?? '', /제공된.*없습니다/);
  assert.equal(travelConditionsNotice('READY', true), null);
});

test('region codes reject malformed, duplicate and whitespace values', () => {
  for (const value of ['11', '12', '36110']) assert.equal(isTravelRegionCode(value), true);
  for (const value of ['', '1', '123456', '-1', '1&areaCode=2', '11\n', ' 11']) assert.equal(isTravelRegionCode(value), false, value);
});
test('content IDs preserve all 20 digits and reject route injection', () => {
  assert.equal(isTravelContentId('99999999999999999999'), true);
  for (const value of ['', '1/extra', 'regions', '1\n', '999999999999999999999']) assert.equal(isTravelContentId(value), false, value);
});
test('only exact public travel GET requests bypass login redirect', () => {
  for (const url of ['/api/places', '/api/places?areaCode=1', '/api/places/regions', '/api/places/123']) assert.equal(isPublicTravelRequest(url, 'get'), true, url);
  for (const url of ['/api/places/admin', '/api/places/123/edit', '/api/orders', 'https://example.com/api/places', '/api/places\n']) assert.equal(isPublicTravelRequest(url, 'get'), false, url);
  for (const method of ['post', 'delete', undefined]) assert.equal(isPublicTravelRequest('/api/places', method), false);
});
test('back links keep a valid region without accepting arbitrary destinations', () => {
  assert.equal(travelListPath('36110'), '/travel?areaCode=36110');
  assert.equal(travelListPath('https://example.com'), '/travel');
  assert.equal(travelListPath(''), '/travel');
});
test('only provider-hosted credential-free HTTPS photos are rendered', () => {
  const photo = 'https://tong.visitkorea.or.kr/cms/resource/60/3458860_image2_1.jpg';
  assert.equal(travelImageUrl(photo), photo);
  for (const value of [null, '', '/photo.jpg', 'http://example.com/photo.jpg', 'javascript:alert(1)', 'data:image/svg+xml,test',
    'https://user:password@example.com/a', 'https://example.com/photo.jpg', photo + '?token=secret', photo + '#fragment',
    photo.replace('tong.visitkorea.or.kr', 'tong.visitkorea.or.kr.evil.example'), photo.replace('https:', 'http:')]) assert.equal(travelImageUrl(value), null);
});
test('text preserves conditions and leaves HTML inert for React text rendering', () => {
  assert.equal(travelText(' 개만 가능<br />목줄 필수 '), '개만 가능\n목줄 필수');
  assert.equal(travelText('<script>alert(1)</script>'), '<script>alert(1)</script>');
  assert.equal(travelText(null), '');
});
test('collection times handle missing or invalid values', () => {
  assert.equal(travelFetchTime(null), null);
  assert.equal(travelFetchTime('not-a-date'), null);
  assert.match(travelFetchTime('2026-09-11T01:00:00Z') ?? '', /2026/);
  const collected = travelFetchTime('2026-09-12T18:37:36.411868Z') ?? '';
  assert.match(collected, /2026\. 9\. 13\./);
  assert.match(collected, /오전 3:37/);
});
