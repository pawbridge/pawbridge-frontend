export const SITE_ORIGIN = 'https://www.pawbridge.kr';
export const SITE_NAME = '포우브릿지';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: 'index,follow' | 'noindex,follow' | 'noindex,nofollow';
  knownRoute: boolean;
}

interface PageDefinition {
  title: string;
  description: string;
  indexable: boolean;
}

const defaultPage: PageDefinition = {
  title: '포우브릿지 | 유기동물 입양과 보호소 찾기',
  description: '전국 보호 동물과 동물보호소를 찾고 유기동물 현황, 입양 후기, 반려동물 동반여행 정보를 확인하세요.',
  indexable: true,
};

const exactPages = new Map<string, PageDefinition>([
  ['/', defaultPage],
  ['/animals', {
    title: '보호 동물 검색 | 포우브릿지',
    description: '지역, 동물 종류, 특징으로 새로운 가족을 기다리는 전국 보호 동물을 검색해 보세요.',
    indexable: true,
  }],
  ['/animals/lost', {
    title: '실종동물 찾기 | 포우브릿지',
    description: '사진과 특징을 바탕으로 보호 중인 동물에서 닮은 실종동물 후보를 찾아보세요.',
    indexable: true,
  }],
  ['/animals/stats', {
    title: '지역별 유기동물 현황 | 포우브릿지',
    description: '전국 구조 동물의 지역별 현황과 보호 상태를 지도와 통계로 비교해 보세요.',
    indexable: true,
  }],
  ['/shelters', {
    title: '전국 동물보호소 찾기 | 포우브릿지',
    description: '지역과 보호소 이름으로 전국 동물보호소의 주소, 연락처와 운영 정보를 찾아보세요.',
    indexable: true,
  }],
  ['/travel', {
    title: '반려동물 동반여행 | 포우브릿지',
    description: '반려동물과 함께 방문할 수 있는 여행지와 이용 정보를 지역별로 찾아보세요.',
    indexable: true,
  }],
  ['/adoption', {
    title: '입양 후기 | 포우브릿지',
    description: '보호 동물과 가족이 된 이후의 따뜻한 입양 이야기를 만나보세요.',
    indexable: true,
  }],
  ['/community', {
    title: '반려동물 커뮤니티 | 포우브릿지',
    description: '실종, 보호, 목격 정보와 반려동물에 관한 이야기를 함께 나누세요.',
    indexable: true,
  }],
  ['/privacy', {
    title: '개인정보처리방침 | 포우브릿지',
    description: '포우브릿지의 개인정보 처리와 이용 분석 도구 사용 방침을 안내합니다.',
    indexable: false,
  }],
  ['/products', {
    title: '펫마켓 | 포우브릿지',
    description: '포우브릿지 펫마켓입니다.',
    indexable: false,
  }],
]);

const detailPages: Array<{ pattern: RegExp; page: PageDefinition }> = [
  {
    pattern: /^\/animals\/[^/]+$/,
    page: {
      title: '보호 동물 상세 | 포우브릿지',
      description: '보호 동물의 사진, 특징, 공고와 보호소 정보를 확인하세요.',
      indexable: true,
    },
  },
  {
    pattern: /^\/shelters\/[^/]+$/,
    page: {
      title: '동물보호소 상세 | 포우브릿지',
      description: '동물보호소의 주소, 연락처와 운영 정보를 확인하세요.',
      indexable: true,
    },
  },
  {
    pattern: /^\/travel\/[^/]+$/,
    page: {
      title: '반려동물 동반여행지 상세 | 포우브릿지',
      description: '반려동물 동반여행지의 위치와 이용 정보를 확인하세요.',
      indexable: true,
    },
  },
  {
    pattern: /^\/adoption\/[^/]+$/,
    page: {
      title: '입양 후기 상세 | 포우브릿지',
      description: '보호 동물과 가족이 된 이후의 입양 이야기를 확인하세요.',
      indexable: true,
    },
  },
  {
    pattern: /^\/community\/[^/]+$/,
    page: {
      title: '커뮤니티 글 | 포우브릿지',
      description: '실종, 보호, 목격 정보와 반려동물 이야기를 확인하세요.',
      indexable: true,
    },
  },
  {
    pattern: /^\/products\/[^/]+$/,
    page: {
      title: '펫마켓 상품 | 포우브릿지',
      description: '포우브릿지 펫마켓 상품입니다.',
      indexable: false,
    },
  },
];

const privatePathPatterns = [
  /^\/admin(?:\/|$)/,
  /^\/(?:login|signup|reset-password|oauth\/callback)\/?$/,
  /^\/(?:mypage|favorite-animals|registered-animals|cart|checkout|order-complete|wishlist|orders)(?:\/|$)/,
  /^\/animals\/new\/?$/,
  /^\/animals\/[^/]+\/edit\/?$/,
  /^\/products\/new\/?$/,
  /^\/products\/[^/]+\/edit\/?$/,
  /^\/community\/new\/?$/,
  /^\/community\/[^/]+\/edit\/?$/,
  /^\/adoption\/new\/?$/,
  /^\/adoption\/[^/]+\/edit\/?$/,
];

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function canonicalUrl(pathname: string): string {
  return new URL(pathname, `${SITE_ORIGIN}/`).toString();
}

export function resolveSeoMetadata(pathname: string, search = ''): SeoMetadata {
  const normalizedPathname = normalizePathname(pathname);
  const exactPage = exactPages.get(normalizedPathname);
  const privateRoute = privatePathPatterns.some(pattern => pattern.test(normalizedPathname));

  if (privateRoute) {
    return {
      title: `로그인이 필요한 화면 | ${SITE_NAME}`,
      description: '로그인한 사용자에게만 제공되는 포우브릿지 화면입니다.',
      canonicalUrl: canonicalUrl(normalizedPathname),
      robots: 'noindex,nofollow',
      knownRoute: true,
    };
  }

  const detailPage = detailPages.find(({ pattern }) => pattern.test(normalizedPathname))?.page;
  const page = exactPage ?? detailPage;

  if (page) {
    const hasQuery = new URLSearchParams(search).size > 0;
    return {
      title: page.title,
      description: page.description,
      canonicalUrl: canonicalUrl(normalizedPathname),
      robots: page.indexable && !hasQuery ? 'index,follow' : 'noindex,follow',
      knownRoute: true,
    };
  }

  return {
    title: `페이지를 찾을 수 없습니다 | ${SITE_NAME}`,
    description: '요청한 포우브릿지 페이지를 찾을 수 없습니다.',
    canonicalUrl: canonicalUrl(normalizedPathname),
    robots: 'noindex,nofollow',
    knownRoute: false,
  };
}
