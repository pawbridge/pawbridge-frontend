import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyReportPath, reportListPath, validReportLoginReturn, rememberReportLoginReturn, consumeReportLoginReturn } from '../src/lib/reportNavigation.ts';

test('제보 종류별 전용 목록을 구분하고 기존 주소의 쿼리와 해시를 보존한다', () => {
  assert.equal(reportListPath(), '/reports/missing');
  assert.equal(reportListPath('SIGHTING'), '/reports/sightings');
  assert.equal(legacyReportPath('/community/reports/new', '?kind=SIGHTING'), '/reports/new?kind=SIGHTING');
  assert.equal(legacyReportPath('/community/reports/42/edit', '', '#photo'), '/reports/42/edit#photo');
});

test('로그인 복귀는 제보 작성과 수정 주소만 허용한다', () => {
  for (const path of ['/reports/new', '/reports/new?kind=MISSING', '/reports/new?kind=SIGHTING', '/reports/42/edit']) assert.equal(validReportLoginReturn(path), true, path);
  for (const path of [undefined, null, '//example.com', 'https://example.com', '/reports/../admin', '/reports/0/edit', '/reports/42/edit?redirect=https://example.com', '/reports/new?kind=OTHER', '/admin/dashboard']) assert.equal(validReportLoginReturn(path), false, String(path));
});

test('로그인 복귀는 한 번만 소비하며 잘못된 값과 저장소 불가 시 홈을 사용한다', () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  try {
    rememberReportLoginReturn('/reports/new?kind=SIGHTING');
    assert.equal(consumeReportLoginReturn(), '/reports/new?kind=SIGHTING');
    assert.equal(consumeReportLoginReturn(), '/');
    rememberReportLoginReturn('//example.com');
    assert.equal(values.size, 0);
    assert.equal(consumeReportLoginReturn(), '/');
  } finally { Reflect.deleteProperty(globalThis, 'sessionStorage'); }
  assert.doesNotThrow(() => rememberReportLoginReturn('/reports/new'));
  assert.equal(consumeReportLoginReturn(), '/');
});
