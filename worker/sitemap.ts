// 검색엔진에 알릴 주소 목록(sitemap)을 만든다.
// 정적 sitemap.xml에는 목록 화면 8개만 있어서, 보호소 상세와 보호 중 동물 상세는 링크를 따라가야만 발견됐다.
//
// 파일을 나누는 이유는 Cloudflare Workers 무료 요금제 한도 때문이다.
// 요청 한 번에 외부 호출(fetch와 Cache API를 합쳐) 50번, CPU 10ms까지만 쓸 수 있다.
// 동물 목록 API는 한 번에 100마리까지 주므로 파일 하나에 5쪽(500마리)만 담는다.
// 2026-11-22 운영 Workers Logs에서 1,000마리 파일을 새로 만든 요청의 CPU가 8~23ms여서 한도 안으로 들도록 절반으로 줄였다.
// 지역 파일은 API를 부르지 않고 고정 목록으로 만든다.
//
// 동물 목록 API는 한 조건에서 앞쪽 10,000건까지만 넘겨 준다.
// 그래서 최근 입소한 보호 중 동물 10,000마리까지만 담는다. 실종 동물을 찾는 보호자가 찾는 것도 최근 입소 동물이다.
import { animalRegions } from '../src/lib/animalRegions.ts';
import { animalRegionPath, SITE_ORIGIN } from '../src/lib/seo.ts';
import { API_ORIGIN } from './detailMetadata.ts';

export const SITEMAP_INDEX_PATH = '/sitemap.xml';

const PAGES_FILE = '/sitemaps/pages.xml';
const REGIONS_FILE = '/sitemaps/regions.xml';
const SHELTERS_FILE = '/sitemaps/shelters.xml';
const ANIMALS_FILE = /^\/sitemaps\/animals-(\d+)\.xml$/;

const ANIMAL_PAGE_SIZE = 100;
const ANIMAL_PAGES_PER_FILE = 5;
const ANIMAL_LIMIT = 10_000;
const MAX_ANIMAL_FILES = ANIMAL_LIMIT / (ANIMAL_PAGE_SIZE * ANIMAL_PAGES_PER_FILE);
const SHELTER_PAGE_SIZE = 1000;
const MAX_SHELTER_PAGES = 3;

const API_TIMEOUT_MS = 5000;
// 만든 목록은 6시간 동안 다시 만들지 않는다. 동물 공고는 하루 몇 번 들어오므로 이 정도 늦어도 된다.
const STORED_SECONDS = 6 * 60 * 60;
const BROWSER_SECONDS = 60 * 60;

// 목록 화면은 지금까지 public/sitemap.xml에 있던 8개와 같다.
export const listPages = ['/', '/animals', '/animals/lost', '/animals/stats', '/shelters', '/travel', '/adoption', '/community'];

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export interface SitemapCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface SitemapOptions {
  development: boolean;
  fetcher?: Fetcher;
  cache?: SitemapCache;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  last: boolean;
}

interface AnimalRow {
  id: number;
}

interface ShelterRow {
  careRegNo?: string | null;
}

class ApiUnavailable extends Error {}

export function isSitemapPath(pathname: string): boolean {
  return pathname === SITEMAP_INDEX_PATH || pathname.startsWith('/sitemaps/');
}

export async function serveSitemap(request: Request, options: SitemapOptions): Promise<Response> {
  const cache = options.cache;
  const url = new URL(request.url);
  // 저장 키에서 ?뒤를 뺀다. 아무 값이나 붙여 저장을 건너뛰면 요청마다 백엔드 API를 다시 부르게 된다.
  const key = new Request(new URL(url.pathname, url.origin).toString(), { method: 'GET' });
  const stored = cache ? await cache.match(key) : undefined;
  if (stored) return forClient(stored, request.method);

  const fresh = await buildSitemap(url.pathname, options);
  if (cache && fresh.status === 200) {
    await cache.put(key, fresh.clone());
  }
  return forClient(fresh, request.method);
}

async function buildSitemap(pathname: string, options: SitemapOptions): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;
  try {
    if (pathname === SITEMAP_INDEX_PATH) {
      return xml(await indexDocument(fetcher, options.development));
    }
    if (pathname === PAGES_FILE) {
      return xml(urlSet(listPages));
    }
    // dev 환경은 운영 API를 부르지 않는다.
    if (options.development) return notFound();
    if (pathname === REGIONS_FILE) {
      return xml(urlSet(regionPaths()));
    }
    if (pathname === SHELTERS_FILE) {
      return xml(urlSet(await shelterPaths(fetcher)));
    }
    const animals = ANIMALS_FILE.exec(pathname);
    if (animals) {
      const fileNumber = Number(animals[1]);
      if (fileNumber < 1 || fileNumber > MAX_ANIMAL_FILES) return notFound();
      return xml(urlSet(await animalPaths(fetcher, fileNumber)));
    }
    return notFound();
  } catch (error) {
    if (error instanceof ApiUnavailable) return unavailable();
    throw error;
  }
}

async function indexDocument(fetcher: Fetcher, development: boolean): Promise<string> {
  const files = [PAGES_FILE];
  if (!development) {
    files.push(REGIONS_FILE, SHELTERS_FILE);
    const first = await readPage<AnimalRow>(fetcher, animalQuery(0, 1));
    const animalCount = Math.min(first.totalElements, ANIMAL_LIMIT);
    const fileCount = Math.ceil(animalCount / (ANIMAL_PAGE_SIZE * ANIMAL_PAGES_PER_FILE));
    for (let number = 1; number <= fileCount; number += 1) {
      files.push(`/sitemaps/animals-${number}.xml`);
    }
  }
  const entries = files.map(path => `  <sitemap><loc>${absolute(path)}</loc></sitemap>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
    '',
  ].join('\n');
}

// 시도별 동물 목록 주소(src/lib/seo.ts가 색인을 여는 주소)를 담는다.
// 예전에는 시도마다 동물 수를 물어 0마리인 지역을 뺐다(17번 호출).
// 백엔드가 통합 주소와 옛 이름을 찾게 고친 뒤(backend #486) 17개 시도 모두 보호 중 동물이 있어 고정 목록으로 둔다.
function regionPaths(): string[] {
  return animalRegions.map(region => animalRegionPath(region.value));
}

async function shelterPaths(fetcher: Fetcher): Promise<string[]> {
  const paths: string[] = [];
  for (let page = 0; page < MAX_SHELTER_PAGES; page += 1) {
    const result = await readPage<ShelterRow>(fetcher, `/api/v1/shelters?page=${page}&size=${SHELTER_PAGE_SIZE}`);
    for (const shelter of result.content) {
      // 상세 화면 주소는 15자리 등록번호만 받는다(worker/detailMetadata.ts와 같은 기준).
      if (shelter.careRegNo && /^\d{15}$/.test(shelter.careRegNo)) {
        paths.push(`/shelters/${shelter.careRegNo}`);
      }
    }
    if (result.last || result.content.length === 0) break;
  }
  return unique(paths);
}

async function animalPaths(fetcher: Fetcher, fileNumber: number): Promise<string[]> {
  const firstPage = (fileNumber - 1) * ANIMAL_PAGES_PER_FILE;
  const pages = Array.from({ length: ANIMAL_PAGES_PER_FILE }, (_, offset) => firstPage + offset);
  // 쪽마다 따로 부르면 느리므로 한꺼번에 부른다. 동물 수가 줄어 없는 쪽은 빈 쪽으로 온다.
  const results = await Promise.all(pages.map(page => readPage<AnimalRow>(fetcher, animalQuery(page, ANIMAL_PAGE_SIZE))));
  const paths = results.flatMap(result => result.content.map(animal => `/animals/${animal.id}`));
  return unique(paths);
}

// 최근 입소 순서로 읽는다. 목록 API의 10,000건 제한 안에서 최근 동물부터 담기 위해서다.
function animalQuery(page: number, size: number): string {
  return `/api/v1/animals?status=PROTECT&sort=createdAt,desc&page=${page}&size=${size}`;
}

async function readPage<T>(fetcher: Fetcher, path: string): Promise<Page<T>> {
  let response: Response;
  try {
    response = await fetcher(API_ORIGIN + path, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch {
    throw new ApiUnavailable();
  }
  if (!response.ok) throw new ApiUnavailable();

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiUnavailable();
  }
  // 동물 API는 { code, data, message } 봉투로 줄 때도 있다(detailMetadata.ts와 같은 처리).
  const data = body && typeof body === 'object' && 'code' in body && 'data' in body ? body.data : body;
  if (!data || typeof data !== 'object' || !Array.isArray((data as Page<T>).content)) {
    throw new ApiUnavailable();
  }
  return data as Page<T>;
}

function urlSet(paths: string[]): string {
  const entries = paths.map(path => `  <url><loc>${absolute(path)}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

function absolute(path: string): string {
  return escapeXml(new URL(path, `${SITE_ORIGIN}/`).toString());
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unique(paths: string[]): string[] {
  return [...new Set(paths)];
}

function xml(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache API에 넣을 때 이 시간 동안 보관된다. 방문자에게 보낼 때는 forClient가 더 짧게 바꾼다.
      'Cache-Control': `public, max-age=${STORED_SECONDS}`,
    },
  });
}

function notFound(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  });
}

// API가 안 될 때 빈 목록을 주면 검색엔진이 주소가 사라진 것으로 볼 수 있다. 나중에 다시 오라고 답한다.
function unavailable(): Response {
  return new Response('Sitemap temporarily unavailable', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '3600', 'Cache-Control': 'no-store' },
  });
}

function forClient(response: Response, method: string): Response {
  const headers = new Headers(response.headers);
  if (response.status === 200) {
    headers.set('Cache-Control', `public, max-age=${BROWSER_SECONDS}`);
    headers.set('X-Robots-Tag', 'noindex');
  }
  return new Response(method === 'HEAD' ? null : response.body, { status: response.status, headers });
}
