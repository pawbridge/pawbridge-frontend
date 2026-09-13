import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shelterSearch, shelterSearchParams, shelterTelephone, shelterMapUrl, isPublicShelterRequest } from '../src/lib/shelters.ts';
test('search conditions and page survive a URL roundtrip', () => {
  assert.deepEqual(shelterSearch(shelterSearchParams(' 보호소 ', ' 서울 ', 2)), { keyword: '보호소', address: '서울', page: 2 });
});
test('invalid page does not reach the API as a negative or non-finite number', () => {
  for (const page of ['-1', 'Infinity', 'abc', '9999999']) assert.equal(shelterSearch(new URLSearchParams({ page })).page, 0);
});
test('telephone and map links cannot turn provider text into a script URL', () => {
  assert.equal(shelterTelephone('02-1234-5678'), 'tel:0212345678');
  assert.equal(shelterTelephone('javascript:alert(1)'), undefined);
  assert.ok(shelterMapUrl('주소 / ? #').startsWith('https://map.naver.com/p/search/'));
});
test('public GET errors stay on shelter screens without changing protected write handling', () => {
  assert.equal(isPublicShelterRequest('/api/shelters?keyword=서울', 'get'), true);
  assert.equal(isPublicShelterRequest('/api/shelters/by-care-reg-no/123456789012345', 'GET'), true);
  assert.equal(isPublicShelterRequest('/api/shelters', 'POST'), false);
  assert.equal(isPublicShelterRequest('/api/admin/users/shelters', 'GET'), false);
});
