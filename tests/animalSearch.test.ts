import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnimalSearchFilters, readAnimalSearch, writeAnimalSearch, defaultAnimalSearch, animalSearchReturnTo, hasAnimalRelevanceSearch, relevanceAnimalSearchSort, visibleAnimalSearchPages } from '../src/utils/animalSearch.ts';

test('검색어·필터·정렬·페이지를 URL로 왕복 복원한다', () => {
  const filters = { ...defaultAnimalSearch, keyword: '믹스 & 흰색 + #', noticeNo: '경남-사천-2026-00027', species: 'DOG', breed: '믹스견', region: '경기', city: '수원', status: 'PROTECT' as const, minAge: 0, maxAge: 5, page: 2, sort: 'age,asc' };
  assert.deepEqual(readAnimalSearch(writeAnimalSearch(filters)), filters);
});
test('초기화 시 기본 URL로 돌아가며 잘못된 숫자를 API 조건에 넣지 않는다', () => {
  assert.equal(writeAnimalSearch(defaultAnimalSearch).toString(), '');
  assert.deepEqual(readAnimalSearch(new URLSearchParams('page=-1&size=10000&minAge=NaN&maxAge=2.5&sort=bad')), defaultAnimalSearch);
});
test('상세의 목록 복귀 주소는 동물 검색 경로만 허용한다', () => {
  assert.equal(animalSearchReturnTo('/animals?keyword=믹스&page=2'), '/animals?keyword=믹스&page=2');
  for (const value of [undefined, '/mypage', '//example.com', 'https://example.com', '/animals/123']) assert.equal(animalSearchReturnTo(value), '/animals');
});

test('화면에는 검색 가능한 10,000건 범위의 페이지만 노출한다', () => {
  assert.equal(visibleAnimalSearchPages(2863, 21), 476);
  assert.equal(visibleAnimalSearchPages(500, 20), 500);
  assert.equal(visibleAnimalSearchPages(3, 21), 3);
});

test('검색어를 새로 적용하면 관련도순을 기본으로 사용한다', () => {
  const applied = applyAnimalSearchFilters(defaultAnimalSearch, {
    ...defaultAnimalSearch,
    keyword: '  흰색 말티즈 오른쪽 귀 검정  ',
  });
  assert.equal(applied.keyword, '흰색 말티즈 오른쪽 귀 검정');
  assert.equal(applied.sort, relevanceAnimalSearchSort);
  assert.equal(applied.page, 0);
  assert.equal(readAnimalSearch(new URLSearchParams('keyword=말티즈')).sort, relevanceAnimalSearchSort);
});

test('품종을 새로 적용하면 관련도순을 사용하고 오타 수정 후에도 첫 페이지로 돌아간다', () => {
  const first = applyAnimalSearchFilters(defaultAnimalSearch, { ...defaultAnimalSearch, breed: '말티즈' });
  assert.equal(first.sort, relevanceAnimalSearchSort);
  assert.equal(first.page, 0);
  const corrected = applyAnimalSearchFilters({ ...first, page: 3 }, { ...first, breed: '마티즈', page: 3 });
  assert.equal(corrected.sort, relevanceAnimalSearchSort);
  assert.equal(corrected.page, 0);
  assert.equal(readAnimalSearch(new URLSearchParams('breed=마티즈')).sort, relevanceAnimalSearchSort);
});

test('공고번호만 검색하면 날짜순을 유지하고 관련도순을 노출하지 않는다', () => {
  const applied = applyAnimalSearchFilters(defaultAnimalSearch, {
    ...defaultAnimalSearch,
    noticeNo: '  경남-사천-2026-00027  ',
  });
  assert.equal(applied.noticeNo, '경남-사천-2026-00027');
  assert.equal(applied.sort, defaultAnimalSearch.sort);
  assert.equal(hasAnimalRelevanceSearch(applied), false);
  assert.equal(readAnimalSearch(new URLSearchParams('noticeNo=경남-사천-2026-00027&sort=relevance,desc')).sort, defaultAnimalSearch.sort);
});

test('같은 검색어에서 사용자가 고른 정렬은 유지하고 검색어를 지우면 관련도순을 해제한다', () => {
  const current = { ...defaultAnimalSearch, keyword: '말티즈', sort: 'createdAt,desc', page: 3 };
  assert.equal(applyAnimalSearchFilters(current, { ...current, species: 'DOG' }).sort, 'createdAt,desc');
  assert.equal(
    applyAnimalSearchFilters(
      { ...current, sort: relevanceAnimalSearchSort },
      { ...current, keyword: undefined, sort: relevanceAnimalSearchSort },
    ).sort,
    defaultAnimalSearch.sort,
  );
});
