import assert from 'node:assert/strict';
import test from 'node:test';
import { API_ORIGIN, resolveDetailMetadata } from '../worker/detailMetadata.ts';

const animal = {
  id: 35798, species: 'DOG', breed: '믹스견', gender: 'MALE', color: '검정색', status: 'PROTECT', age: 0, weight: '3.80(Kg)',
  happenDate: '2026-06-05', happenPlace: '오류동', shelterName: '한마음동물병원', apmsNoticeNo: '인천-서구-2026-00297',
  imageUrl: 'http://openapi.animal.go.kr/openapi/service/rest/fileDownload?file=a.jpg',
};

function fakeFetch(status: number, body?: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  };
  return { calls, fetcher };
}

test('동물 상세는 API 데이터로 제목, 설명, https 사진을 만든다', async () => {
  const { calls, fetcher } = fakeFetch(200, { code: 200, data: animal, message: 'ok' });
  const detail = await resolveDetailMetadata('/animals/35798', fetcher);

  assert.equal(detail?.kind, 'found');
  assert.ok(detail.kind === 'found');
  assert.equal(detail.text.title, '믹스견 수컷 검정색, 인천 서구 보호 중 - 포우브릿지');
  assert.match(detail.text.description, /공고번호 인천-서구-2026-00297/);
  assert.equal(detail.image, 'https://openapi.animal.go.kr/openapi/service/rest/fileDownload?file=a.jpg');
  assert.equal(calls[0].url, `${API_ORIGIN}/api/v1/animals/35798`);
  assert.ok(calls[0].init.signal, '느린 API를 끊을 시간 제한이 있어야 한다');
});

test('보호소 상세는 등록번호로 읽고 전화번호가 없으면 공개 정보 번호를 쓴다', async () => {
  const { calls, fetcher } = fakeFetch(200, {
    name: '펫동물병원', organizationName: '대구광역시 수성구', address: '대구광역시 수성구 달구벌대로 3144',
    phone: null, publicInformation: { phone: '053-474-9820' },
  });
  const detail = await resolveDetailMetadata('/shelters/327346201900001', fetcher);

  assert.ok(detail?.kind === 'found');
  assert.equal(detail.text.title, '펫동물병원, 대구광역시 수성구 동물보호소 - 포우브릿지');
  assert.match(detail.text.description, /연락처 053-474-9820/);
  assert.equal(calls[0].url, `${API_ORIGIN}/api/v1/shelters/by-care-reg-no/327346201900001`);
});

test('API가 404, 400이면 없는 상세로 본다', async () => {
  assert.deepEqual(await resolveDetailMetadata('/animals/999999999', fakeFetch(404, { code: 404 }).fetcher), { kind: 'missing' });
  assert.deepEqual(await resolveDetailMetadata('/shelters/999999999999999', fakeFetch(400, { code: 400 }).fetcher), { kind: 'missing' });
});

test('API가 실패하거나 늦으면 공통 문구로 둔다', async () => {
  assert.equal(await resolveDetailMetadata('/animals/1', fakeFetch(500, { code: 500 }).fetcher), null);
  assert.equal(await resolveDetailMetadata('/animals/1', async () => new Response('{', { status: 200 })), null);
  assert.equal(await resolveDetailMetadata('/animals/1', fakeFetch(200, { code: 200, data: null }).fetcher), null);
  const timeout = async () => { throw new DOMException('timed out', 'TimeoutError'); };
  assert.equal(await resolveDetailMetadata('/shelters/327346201900001', timeout), null);
});

test('상세가 아니거나 형식이 틀린 주소는 API를 부르지 않는다', async () => {
  for (const path of ['/', '/animals', '/animals/lost', '/animals/abc', '/animals/1/edit', '/shelters/abc', '/travel/1']) {
    const { calls, fetcher } = fakeFetch(200, animal);
    assert.equal(await resolveDetailMetadata(path, fetcher), null, path);
    assert.equal(calls.length, 0, path);
  }
});
