// 동물, 보호소 상세의 HTML에 데이터로 만든 제목과 설명을 넣는다.
// 카카오톡, 네이버 같은 공유 미리보기와 일부 검색 수집기는 JS를 실행하지 않아 화면이 바꾼 문구(usePageText)를 못 본다.
// API가 없다고 답한 상세는 404와 noindex로 내보내 Soft 404로 잡히지 않게 한다.
// API가 느리거나 실패하면 지금처럼 공통 문구로 내보낸다. 미리보기 때문에 화면이 늦게 뜨면 안 된다.
import { animalPageText, shelterPageText, type PageText } from '../src/lib/seoDetail.ts';
import type { Animal } from '../src/types/api.types.ts';

export const API_ORIGIN = 'https://api.pawbridge.kr';
const API_TIMEOUT_MS = 1500;

export type DetailMetadata =
  | { kind: 'found'; text: PageText; image?: string }
  | { kind: 'missing' };

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

interface ShelterResponse {
  name: string;
  organizationName?: string | null;
  address?: string | null;
  phone?: string | null;
  publicInformation?: { phone?: string | null } | null;
}

// 같은 상세를 여러 사람이 열어도 API는 몇 분에 한 번만 부른다. 실패 응답은 저장하지 않는다.
const cacheOptions = { cacheTtlByStatus: { '200-299': 300, '404': 60, '400': 60 } };

// 미리보기 서비스가 http 이미지를 막는 경우가 있어 https로 바꾼다. 공공데이터 이미지 서버는 https도 받는다.
function previewImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  const secure = url.replace(/^http:\/\//, 'https://');
  return secure.startsWith('https://') ? secure : undefined;
}

async function readJson<T>(fetcher: Fetcher, path: string): Promise<T | 'missing' | null> {
  try {
    const response = await fetcher(API_ORIGIN + path, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      cf: cacheOptions,
    } as RequestInit);
    // 화면의 isMissingResponse와 같은 기준이다. 5xx는 일시적일 수 있어 공통 문구로 둔다.
    if (response.status === 404 || response.status === 400) return 'missing';
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return null;
    // 동물 API는 { code, data, message } 봉투로 줄 때도 있다(getAnimalById와 같은 처리).
    const data = 'code' in body && 'data' in body ? body.data : body;
    return data && typeof data === 'object' ? data as T : null;
  } catch {
    return null;
  }
}

export async function resolveDetailMetadata(pathname: string, fetcher: Fetcher = fetch): Promise<DetailMetadata | null> {
  const animal = /^\/animals\/(\d+)\/?$/.exec(pathname);
  if (animal) {
    const result = await readJson<Animal>(fetcher, `/api/v1/animals/${animal[1]}`);
    if (result === 'missing') return { kind: 'missing' };
    return result ? { kind: 'found', text: animalPageText(result), image: previewImage(result.imageUrl) } : null;
  }

  const shelter = /^\/shelters\/(\d{15})\/?$/.exec(pathname);
  if (shelter) {
    const result = await readJson<ShelterResponse>(fetcher, `/api/v1/shelters/by-care-reg-no/${shelter[1]}`);
    if (result === 'missing') return { kind: 'missing' };
    return result
      ? { kind: 'found', text: shelterPageText({ ...result, phone: result.phone || result.publicInformation?.phone }) }
      : null;
  }

  return null;
}
