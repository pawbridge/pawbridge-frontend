import test from 'node:test';
import assert from 'node:assert/strict';
import { animalPageText, noticeRegion, postPageText, shelterPageText, travelPageText } from '../src/lib/seoDetail.ts';
import type { Animal } from '../src/types/api.types.ts';
import type { TravelDetail } from '../src/types/travel.types.ts';

const animal = {
  id: 35798, name: '', species: 'DOG', breed: '믹스견', gender: 'MALE', age: 0, weight: '3.80(Kg)', color: '검정색',
  specialMark: '들개 자견으로 추정', status: 'PROTECT', shelterId: 294, shelterName: '한마음동물병원',
  apmsNoticeNo: '인천-서구-2026-00297', happenPlace: '오류동 백석산로57번길14-6', happenDate: '2026-06-05',
} satisfies Animal;

test('공고번호 앞 두 칸을 지역으로 읽는다', () => {
  assert.equal(noticeRegion('인천-서구-2026-00297'), '인천 서구');
  assert.equal(noticeRegion('경기-수원-2026-00001'), '경기 수원');
  assert.equal(noticeRegion('2026-00001'), '');
  assert.equal(noticeRegion(undefined), '');
});

test('동물 상세는 품종, 성별, 색, 지역, 상태로 제목을 만들고 구조 정보로 설명을 만든다', () => {
  const text = animalPageText(animal);
  assert.equal(text.title, '믹스견 수컷 검정색, 인천 서구 보호 중 | 포우브릿지');
  assert.equal(text.description,
    '2026.06.05 인천 서구 오류동 백석산로57번길14-6에서 구조된 믹스견(수컷, 1세 미만, 3.80(Kg), 검정색)입니다. 특징: 들개 자견으로 추정. 한마음동물병원, 보호 중. 공고번호 인천-서구-2026-00297');
});

test('같은 품종이어도 다른 동물이면 제목이나 설명이 다르다', () => {
  const other = animalPageText({ ...animal, id: 85479, color: '갈색', apmsNoticeNo: '대구-수성-2026-00010', happenPlace: '노변동' });
  const first = animalPageText(animal);
  assert.notEqual(other.title, first.title);
  assert.notEqual(other.description, first.description);
});

test('비어 있는 값은 문장에서 빼고, 설명은 150자를 넘지 않는다', () => {
  const sparse = animalPageText({ id: 1, name: '', species: 'CAT', gender: 'UNKNOWN', status: 'ADOPTED', shelterId: 1 });
  assert.equal(sparse.title, '고양이, 종료 (입양) | 포우브릿지');
  assert.equal(sparse.description, '고양이입니다. 종료 (입양).');
  const long = animalPageText({ ...animal, specialMark: '가'.repeat(400) });
  assert.equal(long.description.length, 150);
  assert.ok(long.description.endsWith('…'));
});

test('보호소, 여행지, 글 상세도 각자의 이름으로 제목을 만든다', () => {
  assert.equal(shelterPageText({ name: '펫동물병원', organizationName: '대구광역시 수성구', address: '대구광역시 수성구 달구벌대로 3144', phone: '053-474-9820' }).title,
    '펫동물병원, 대구광역시 수성구 동물보호소 | 포우브릿지');
  const travel = { place: { contentId: '1', title: '강아지 숲', address: '강원 춘천시', imageUrl: null }, overview: '  반려견과   산책하기 좋은 숲  ' } as TravelDetail;
  assert.deepEqual(travelPageText(travel), { title: '강아지 숲, 반려동물 동반여행 | 포우브릿지', description: '강원 춘천시. 반려견과 산책하기 좋은 숲' });
  assert.equal(postPageText({ title: '콩이 입양했어요', content: '' }, 'adoption').description, '콩이 입양했어요 입양 이야기를 확인하세요.');
  assert.equal(postPageText({ title: '산책 질문', content: '첫 줄\n둘째 줄' }, 'community').title, '산책 질문 | 포우브릿지');
});
