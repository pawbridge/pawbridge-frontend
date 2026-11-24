import assert from 'node:assert/strict';
import test from 'node:test';
import { API_ORIGIN } from '../worker/detailMetadata.ts';
import { listPages, serveSitemap, type SitemapCache } from '../worker/sitemap.ts';

const SITE = 'https://www.pawbridge.kr';

interface Call {
  url: string;
  init: RequestInit;
}

// 경로별로 정해 둔 응답을 돌려주는 가짜 API. 부른 주소를 모두 기록한다.
function fakeApi(handler: (url: URL) => { status: number; body?: unknown }) {
  const calls: Call[] = [];
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const { status, body } = handler(new URL(url));
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  };
  return { calls, fetcher };
}

function animalPage(ids: number[], totalElements: number, last = false) {
  return { content: ids.map(id => ({ id })), totalElements, last };
}

function memoryCache(): SitemapCache & { entries: Map<string, Response> } {
  const entries = new Map<string, Response>();
  return {
    entries,
    async match(request) {
      return entries.get(request.url)?.clone();
    },
    async put(request, response) {
      entries.set(request.url, response);
    },
  };
}

function get(path: string, method = 'GET') {
  return new Request(`${SITE}${path}`, { method });
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
}

test('색인은 목록 화면, 보호소, 동물 수에 맞는 동물 파일을 가리킨다', async () => {
  const { calls, fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 2_345) }));
  const response = await serveSitemap(get('/sitemap.xml'), { development: false, fetcher });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type') ?? '', /application\/xml/);
  assert.match(body, /<sitemapindex /);
  assert.deepEqual(locs(body), [
    `${SITE}/sitemaps/pages.xml`,
    `${SITE}/sitemaps/regions.xml`,
    `${SITE}/sitemaps/shelters.xml`,
    `${SITE}/sitemaps/animals-1.xml`,
    `${SITE}/sitemaps/animals-2.xml`,
    `${SITE}/sitemaps/animals-3.xml`,
    `${SITE}/sitemaps/animals-4.xml`,
    `${SITE}/sitemaps/animals-5.xml`,
  ]);
  assert.equal(calls.length, 1, '색인은 동물 수만 한 번 묻는다');
  assert.equal(new URL(calls[0].url).searchParams.get('status'), 'PROTECT');
});

test('동물이 10,000마리를 넘어도 목록 API가 넘겨 주는 20개 파일까지만 가리킨다', async () => {
  const { fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 13_020) }));
  const body = await (await serveSitemap(get('/sitemap.xml'), { development: false, fetcher })).text();

  const animalFiles = locs(body).filter(loc => loc.includes('/animals-'));
  assert.equal(animalFiles.length, 20);
  assert.equal(animalFiles.at(-1), `${SITE}/sitemaps/animals-20.xml`);
});

test('목록 화면 파일은 API 없이 기존 8개 화면을 담는다', async () => {
  const { calls, fetcher } = fakeApi(() => ({ status: 500 }));
  const body = await (await serveSitemap(get('/sitemaps/pages.xml'), { development: false, fetcher })).text();

  assert.match(body, /<urlset /);
  assert.deepEqual(locs(body), listPages.map(path => new URL(path, `${SITE}/`).toString()));
  assert.equal(locs(body).length, 8);
  assert.equal(calls.length, 0);
});

test('지역 파일은 API를 부르지 않고 17개 시도의 목록 주소를 담는다', async () => {
  const { calls, fetcher } = fakeApi(() => ({ status: 500 }));
  const response = await serveSitemap(get('/sitemaps/regions.xml'), { development: false, fetcher });
  const urls = locs(await response.text());

  assert.equal(response.status, 200);
  assert.equal(calls.length, 0);
  assert.equal(urls.length, 17);
  assert.equal(new Set(urls).size, 17);
  assert.ok(urls.includes(`${SITE}/animals?region=${encodeURIComponent('부산광역시')}`));
  assert.ok(urls.includes(`${SITE}/animals?region=${encodeURIComponent('광주광역시')}`));
});

test('지역 파일의 주소는 그 주소의 정규 URL과 같다', async () => {
  const { resolveSeoMetadata } = await import('../src/lib/seo.ts');
  const { fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 1) }));
  const body = await (await serveSitemap(get('/sitemaps/regions.xml'), { development: false, fetcher })).text();

  for (const loc of locs(body)) {
    const url = new URL(loc);
    const metadata = resolveSeoMetadata(url.pathname, url.search);
    assert.equal(metadata.canonicalUrl, loc);
    assert.equal(metadata.robots, 'index,follow');
  }
});

test('보호소 파일은 15자리 등록번호가 있는 보호소만 상세 주소로 담는다', async () => {
  const { calls, fetcher } = fakeApi(() => ({
    status: 200,
    body: {
      content: [{ careRegNo: '327346201900001' }, { careRegNo: null }, { careRegNo: '12' }, { careRegNo: '311322200900001' }],
      totalElements: 4,
      last: true,
    },
  }));
  const body = await (await serveSitemap(get('/sitemaps/shelters.xml'), { development: false, fetcher })).text();

  assert.deepEqual(locs(body), [`${SITE}/shelters/327346201900001`, `${SITE}/shelters/311322200900001`]);
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url).pathname, '/api/v1/shelters');
});

test('동물 파일 2번은 최근 입소 순서의 5~9쪽을 100마리씩 읽는다', async () => {
  const { calls, fetcher } = fakeApi(url => {
    const page = Number(url.searchParams.get('page'));
    return { status: 200, body: animalPage([page * 1000 + 1, page * 1000 + 2], 13_020) };
  });
  const body = await (await serveSitemap(get('/sitemaps/animals-2.xml'), { development: false, fetcher })).text();

  const pages = calls.map(call => new URL(call.url).searchParams.get('page'));
  assert.deepEqual(pages, ['5', '6', '7', '8', '9']);
  for (const call of calls) {
    const url = new URL(call.url);
    assert.equal(url.origin, API_ORIGIN);
    assert.equal(url.searchParams.get('size'), '100');
    assert.equal(url.searchParams.get('status'), 'PROTECT');
    assert.equal(url.searchParams.get('sort'), 'createdAt,desc');
    assert.ok(call.init.signal, '느린 API를 끊을 시간 제한이 있어야 한다');
  }
  assert.equal(locs(body).length, 10);
  assert.equal(locs(body)[0], `${SITE}/animals/5001`);
});

test('쪽이 바뀌며 겹친 동물은 한 번만 담는다', async () => {
  const { fetcher } = fakeApi(() => ({ status: 200, body: animalPage([7, 8], 20) }));
  const body = await (await serveSitemap(get('/sitemaps/animals-1.xml'), { development: false, fetcher })).text();

  assert.deepEqual(locs(body), [`${SITE}/animals/7`, `${SITE}/animals/8`]);
});

test('API가 실패하면 빈 목록 대신 503을 주고 저장하지 않는다', async () => {
  const cache = memoryCache();
  const { fetcher } = fakeApi(() => ({ status: 502 }));
  const response = await serveSitemap(get('/sitemaps/animals-1.xml'), { development: false, fetcher, cache });

  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Retry-After'), '3600');
  assert.equal(cache.entries.size, 0);
});

test('API가 응답하지 않으면 503을 준다', async () => {
  const fetcher = async () => {
    throw new Error('timeout');
  };
  const response = await serveSitemap(get('/sitemap.xml'), { development: false, fetcher });

  assert.equal(response.status, 503);
});

test('만든 목록은 저장해 두고 다음 요청은 API를 부르지 않는다', async () => {
  const cache = memoryCache();
  const { calls, fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 500) }));

  const first = await serveSitemap(get('/sitemap.xml'), { development: false, fetcher, cache });
  const second = await serveSitemap(get('/sitemap.xml'), { development: false, fetcher, cache });

  assert.equal(calls.length, 1);
  assert.equal(await second.text(), await first.text());
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=3600');
  const stored = cache.entries.get(`${SITE}/sitemap.xml`);
  assert.equal(stored?.headers.get('Cache-Control'), 'public, max-age=21600');
});

test('주소 뒤에 아무 값을 붙여도 같은 저장본을 쓰고 API를 다시 부르지 않는다', async () => {
  const cache = memoryCache();
  const { calls, fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1, 2], 2) }));

  await serveSitemap(get('/sitemaps/animals-1.xml'), { development: false, fetcher, cache });
  const callsAfterFirst = calls.length;
  const again = await serveSitemap(get('/sitemaps/animals-1.xml?nocache=123'), { development: false, fetcher, cache });

  assert.equal(again.status, 200);
  assert.equal(calls.length, callsAfterFirst);
  assert.deepEqual([...cache.entries.keys()], [`${SITE}/sitemaps/animals-1.xml`]);
});

test('없는 동물 파일 번호와 모르는 파일은 404다', async () => {
  const { calls, fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 1) }));

  for (const path of ['/sitemaps/animals-0.xml', '/sitemaps/animals-21.xml', '/sitemaps/unknown.xml']) {
    const response = await serveSitemap(get(path), { development: false, fetcher });
    assert.equal(response.status, 404, path);
  }
  assert.equal(calls.length, 0);
});

test('dev 환경은 운영 API를 부르지 않고 목록 화면 파일만 가리킨다', async () => {
  const { calls, fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 1) }));

  const index = await (await serveSitemap(get('/sitemap.xml'), { development: true, fetcher })).text();
  const animals = await serveSitemap(get('/sitemaps/animals-1.xml'), { development: true, fetcher });

  assert.deepEqual(locs(index), [`${SITE}/sitemaps/pages.xml`]);
  assert.equal(animals.status, 404);
  assert.equal(calls.length, 0);
});

test('HEAD 요청은 본문 없이 같은 상태와 헤더를 준다', async () => {
  const { fetcher } = fakeApi(() => ({ status: 200, body: animalPage([1], 1) }));
  const response = await serveSitemap(get('/sitemaps/pages.xml', 'HEAD'), { development: false, fetcher });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type') ?? '', /application\/xml/);
  assert.equal(await response.text(), '');
});
