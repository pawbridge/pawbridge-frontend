import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyReportSearch, koreaToday, reportPeriodRange, reportSearchError, readReportSearch, reportSearchParams } from '../src/lib/reportSearch.ts';
import { reportRegions } from '../src/lib/reportRegions.ts';

test('최근 7일과 30일은 한국 날짜 기준 양 끝을 포함한다', () => {
  assert.equal(koreaToday(new Date('2026-09-30T16:00:00Z')), '2026-10-01');
  assert.deepEqual(reportPeriodRange(7, '2026-10-01'), { from: '2026-09-25', to: '2026-10-01' });
  assert.deepEqual(reportPeriodRange(30, '2026-10-01'), { from: '2026-09-02', to: '2026-10-01' });
});
test('URL은 필터와 실제 날짜를 보존하고 새 검색은 페이지를 초기화한다', () => {
  const filters = { ...emptyReportSearch, province: '서울특별시', district: '마포구', animalType: 'DOG' as const,
    keyword: '파란 목줄', period: '7' as const, ...reportPeriodRange(7, '2026-10-01') };
  const params = reportSearchParams(filters, 2);
  assert.equal(params.get('page'), '3');
  assert.deepEqual(readReportSearch(params), filters);
  assert.equal(reportSearchParams(readReportSearch(params)).has('page'), false);
  assert.equal(reportSearchParams(emptyReportSearch).toString(), '');
});
test('잘못된 날짜·미래 날짜·범위 역전·미선택 지역·종류를 거부한다', () => {
  const custom = { ...emptyReportSearch, period: 'custom' as const };
  for (const value of ['2026-02-30', 'not-a-date', '2026-10-02']) {
    assert.notEqual(reportSearchError({ ...custom, from: value, to: '2026-10-01' }, '2026-10-01'), '');
  }
  assert.notEqual(reportSearchError(custom, '2026-10-01'), '');
  assert.notEqual(reportSearchError({ ...custom, from: '2026-09-30', to: '2026-09-01' }, '2026-10-01'), '');
  assert.notEqual(reportSearchError({ ...emptyReportSearch, district: '마포구' }), '');
  assert.notEqual(reportSearchError({ ...emptyReportSearch, province: '잘못된 지역' }), '');
  assert.notEqual(reportSearchError(readReportSearch(new URLSearchParams('animalType=BIRD'))), '');
  assert.notEqual(reportSearchError({ ...emptyReportSearch, keyword: '가'.repeat(101) }), '');
  assert.equal(reportSearchError({ ...custom, from: '2026-09-01', to: '2026-09-30' }, '2026-10-01'), '');
});
test('기간만 있는 URL도 날짜를 적용하며 인천 신설 구를 선택할 수 있다', () => {
  const preset = readReportSearch(new URLSearchParams('period=7'));
  assert.deepEqual({ from: preset.from, to: preset.to }, reportPeriodRange(7));
  assert.equal(reportSearchError(preset), '');
  assert.ok(reportRegions.find(region => region.value === '인천광역시')?.cities.includes('영종구'));
});
