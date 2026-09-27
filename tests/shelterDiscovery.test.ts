import test from 'node:test';
import assert from 'node:assert/strict';
import { koreaToday, readShelterDiscovery, writeShelterDiscovery, validIntakeRange, shelterAnimalUrl, shelterListReturnTo, observationDays } from '../src/utils/shelterDiscovery.ts';
import { readAnimalSearch, writeAnimalSearch } from '../src/utils/animalSearch.ts';
import { isPublicShelterRequest } from '../src/lib/shelters.ts';

test('최근 30일은 한국시간 오늘을 포함하고 월·연도 경계를 넘는다', () => {
  assert.equal(koreaToday(new Date('2026-09-26T15:00:00Z')), '2026-09-27');
  assert.equal(koreaToday(new Date('2026-09-26T14:59:59Z')), '2026-09-26');
  assert.deepEqual(readShelterDiscovery(new URLSearchParams(), '2026-01-10'),
    { keyword: '', address: '', page: 0, intakeFrom: '2025-12-12', intakeTo: '2026-01-10' });
});
test('직접 선택은 실제 날짜와 양 끝 포함 최대 366일만 허용한다', () => {
  assert.ok(validIntakeRange('2024-02-29', '2024-02-29'));
  assert.ok(validIntakeRange('2024-01-01', '2024-12-31'));
  for (const [from, to] of [['2026-02-29', '2026-03-01'], ['', '2026-03-01'], ['2026-03-02', '2026-03-01'], ['2024-01-01', '2025-01-01']]) assert.equal(validIntakeRange(from, to), false);
});
test('보호소 검색 조건·페이지와 동물 검색의 보호소·기간을 URL로 보존한다', () => {
  const filters = { keyword: '동물 보호소', address: '서울', page: 3, intakeFrom: '2026-08-29', intakeTo: '2026-09-27' };
  assert.deepEqual(readShelterDiscovery(writeShelterDiscovery(filters)), filters);
  const url = new URL(shelterAnimalUrl(42, filters), 'https://example.test');
  const animals = readAnimalSearch(url.searchParams);
  assert.equal(animals.shelterId, 42);
  assert.equal(animals.status, 'PROTECT');
  assert.equal(animals.sort, 'happenDate,desc');
  assert.equal(animals.intakeFrom, filters.intakeFrom);
  assert.equal(animals.intakeTo, filters.intakeTo);
  assert.deepEqual(readAnimalSearch(writeAnimalSearch(animals)), animals);
  assert.equal(shelterListReturnTo(url.searchParams.get('shelterReturnTo')), `/shelters?${writeShelterDiscovery(filters)}`);
});
test('보호소 맥락의 공고번호 조회도 보호소·기간·보호중을 유지한다', () => {
  const filters = readAnimalSearch(new URLSearchParams('shelterId=42&intakeFrom=2026-09-01&intakeTo=2026-09-27&noticeNo=공고&status=ADOPTED'));
  assert.equal(filters.shelterId, 42);
  assert.equal(filters.intakeFrom, '2026-09-01');
  assert.equal(filters.status, 'PROTECT');
});
test('기록 없음과 관측한 0마리를 구분하며 다른 날짜를 추정하지 않는다', () => {
  const zero = { date: '2026-09-26', protectedCount: 0 };
  assert.deepEqual(observationDays('2026-09-25', '2026-09-27', [zero]), [
    { date: '2026-09-25', point: null }, { date: zero.date, point: zero }, { date: '2026-09-27', point: null },
  ]);
});
test('목록 복귀는 내부 경로만, 신규 API는 공개 GET만 허용한다', () => {
  for (const value of ['https://evil.test', '//evil.test', '/shelters-other', '/shelters/42']) assert.equal(shelterListReturnTo(value), '/shelters');
  for (const url of ['/api/shelters/discovery?intakeFrom=2026-09-01', '/api/shelters/42/observations?from=2026-09-01']) {
    assert.ok(isPublicShelterRequest(url, 'GET'));
    assert.equal(isPublicShelterRequest(url, 'POST'), false);
  }
});
