import test from 'node:test';
import assert from 'node:assert/strict';
import { readAnimalSearch, writeAnimalSearch, defaultAnimalSearch, animalSearchReturnTo } from '../src/utils/animalSearch.ts';

test('검색어·필터·정렬·페이지를 URL로 왕복 복원한다', () => {
  const filters = { ...defaultAnimalSearch, keyword: '믹스 & 흰색 + #', species: 'DOG', breed: '믹스견', region: '경기', city: '수원', status: 'PROTECT' as const, minAge: 0, maxAge: 5, page: 2, sort: 'age,asc' };
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
