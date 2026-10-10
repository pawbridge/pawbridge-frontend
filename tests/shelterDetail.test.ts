import test from 'node:test';
import assert from 'node:assert/strict';
import { readShelterAnimals, writeShelterAnimals, shelterAnimalRequest, shelterLastValidPage, shelterPageCount, shelterDetailReturnTo, shelterDetailPath, shelterDetailUrl } from '../src/utils/shelterDetail.ts';
import { readShelterView, saveShelterView } from '../src/utils/shelterView.ts';

test('보호소 상세는 기간 전체 보호중 동물을 12마리씩 조회한다', () => {
  assert.deepEqual(shelterAnimalRequest(59, readShelterAnimals(new URLSearchParams())), {
    page: 0, species: undefined, sort: 'happenDate,desc', shelterId: 59, status: 'PROTECT', size: 12,
  });
});
test('필터·정렬·페이지와 원래 진입 화면을 URL로 왕복 보존한다', () => {
  const params = new URLSearchParams({ returnTo: '/animals/42' });
  const filters = { page: 21, species: 'CAT' as const, sort: 'happenDate,asc' as const, intakeFrom: '2026-09-01', intakeTo: '2026-10-10' };
  const written = writeShelterAnimals(params, filters);
  assert.deepEqual(readShelterAnimals(written), filters);
  assert.equal(written.get('returnTo'), '/animals/42');
  assert.equal(writeShelterAnimals(written, { ...filters, page: 0, species: '', intakeFrom: undefined, intakeTo: undefined }).get('page'), null);
  assert.equal(writeShelterAnimals(written, readShelterAnimals(params)).get('intakeFrom'), null);
});
test('잘못된 필터·날짜와 지나친 페이지는 API의 안전한 범위로 제한한다', () => {
  for (const page of ['-1', 'NaN', '2.5', '999999999999999999999']) assert.equal(readShelterAnimals(new URLSearchParams({ page })).page, 0);
  assert.equal(readShelterAnimals(new URLSearchParams('page=9999')).page, 832);
  assert.deepEqual(readShelterAnimals(new URLSearchParams('species=bad&sort=bad&intakeFrom=2026-02-29&intakeTo=2026-03-01')), { page: 0, species: '', sort: 'happenDate,desc' });
  assert.equal(shelterPageCount(1000), 833);
  assert.ok((shelterLastValidPage(9999, 1000) + 1) * 12 <= 10_000);
});
test('마지막 페이지가 줄거나 빈 결과가 되면 유효한 마지막 페이지로 복구한다', () => {
  assert.equal(shelterLastValidPage(21, 22), 21);
  assert.equal(shelterLastValidPage(21, 3), 2);
  assert.equal(shelterLastValidPage(21, 0), 0);
  assert.equal(shelterLastValidPage(0, 1), 0);
});
test('찾기에서 상세로 이동하면 찾기 기간은 복귀 주소에 남고 동물 목록은 기간 전체다', () => {
  const finder = '/shelters?keyword=제주&page=3&intakeFrom=2026-09-11&intakeTo=2026-10-10';
  const url = new URL(shelterDetailUrl('350650201200001', finder), 'https://example.test');
  assert.equal(url.searchParams.get('returnTo'), finder);
  assert.equal(readShelterAnimals(url.searchParams).intakeFrom, undefined);
});
test('복귀 주소는 내부 동물·보호소 경로만 허용한다', () => {
  for (const url of ['/animals/42', '/animals?species=CAT&page=2', '/shelters?keyword=제주']) assert.equal(shelterDetailReturnTo(url), url);
  for (const url of ['//evil.test', 'https://evil.test', '/animals/../admin', '/shelters-other', '/animals/0']) assert.equal(shelterDetailReturnTo(url), '/shelters');
  assert.equal(shelterDetailPath('/shelters/350650201200001?page=2'), '/shelters/350650201200001?page=2');
  assert.equal(shelterDetailPath('/shelters/../admin'), undefined);
});
test('복귀 스크롤과 펼친 보호현황은 진입 기록별로 보존하고 20개로 제한한다', () => {
  saveShelterView('origin', { scrollY: 1234, expanded: [59] });
  saveShelterView('origin', { scrollY: 1300 });
  assert.deepEqual(readShelterView('origin'), { scrollY: 1300, expanded: [59] });
  readShelterView('origin')!.expanded.push(1);
  assert.deepEqual(readShelterView('origin')!.expanded, [59]);
  for (let i = 0; i < 20; i++) saveShelterView(`entry-${i}`, { scrollY: i });
  assert.equal(readShelterView('origin'), undefined);
});
