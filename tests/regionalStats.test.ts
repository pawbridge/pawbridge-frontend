import test from 'node:test';
import assert from 'node:assert/strict';
import { bubbleRadius, buildRegionRows, kstToday, periodStart, validateDateRange } from '../src/components/statistics/regionalStats.ts';

test('지역 별칭을 합산하고 누락된 시도도 0건으로 선택 가능하게 유지한다', () => {
  const rows = buildRegionRows([{ region: '강원도', count: 2 }, { region: '강원', count: 3 }, { region: '전북특별자치도', count: 7 }]);
  assert.equal(rows.length, 17);
  assert.deepEqual(rows.slice(0, 2), [{ name: '전북특별자치도', count: 7 }, { name: '강원특별자치도', count: 5 }]);
  assert.equal(rows.find(row => row.name === '세종특별자치시')?.count, 0);
});
test('지도 좌표가 없는 지역도 집계와 비교 목록에서 누락하지 않는다', () => {
  const rows = buildRegionRows([{ region: '미분류', count: 4 }]);
  assert.equal(rows.length, 18);
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), 4);
});
test('원 면적은 건수에 비례하고 0건에는 원을 그리지 않는다', () => {
  assert.equal(bubbleRadius(0, 100), 0);
  assert.equal(bubbleRadius(0, 0), 0);
  assert.equal(bubbleRadius(25, 100) ** 2 / bubbleRadius(100, 100) ** 2, 0.25);
});
test('호스트 시간대와 무관하게 한국 자정에서 날짜가 바뀐다', () => {
  assert.equal(kstToday(new Date('2026-09-10T14:59:59Z')), '2026-09-10');
  assert.equal(kstToday(new Date('2026-09-10T15:00:00Z')), '2026-09-11');
});
test('조회 일수는 종료일을 포함하며 월 경계를 처리한다', () => {
  assert.equal(periodStart('2026-09-11', 1), '2026-09-11');
  assert.equal(periodStart('2026-09-11', 7), '2026-09-05');
  assert.equal(periodStart('2026-09-11', 30), '2026-08-13');
});
test('미입력, 역전, 미래 기간을 차단하고 같은 날짜는 허용한다', () => {
  assert.notEqual(validateDateRange('', '2026-09-11', '2026-09-11'), '');
  assert.notEqual(validateDateRange('2026-09-11', '2026-09-10', '2026-09-11'), '');
  assert.notEqual(validateDateRange('2026-09-11', '2026-09-12', '2026-09-11'), '');
  assert.equal(validateDateRange('2026-09-11', '2026-09-11', '2026-09-11'), '');
});
