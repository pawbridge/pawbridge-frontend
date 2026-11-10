import { resolveSeoMetadata, SITE_NAME, type SeoMetadata } from '../src/lib/seo';
import { CSP_REPORT_PATH, receiveCspReport } from './cspReport';
import { resolveDetailMetadata, type DetailMetadata } from './detailMetadata';

function shellRequest(request: Request): Request {
  const url = new URL('/', request.url);
  return new Request(url, { method: 'GET' });
}

// 주소로 정한 공통 문구 위에 상세 데이터로 만든 문구를 덮는다.
function withDetail(metadata: SeoMetadata, detail: DetailMetadata | null): SeoMetadata {
  if (!detail) return metadata;
  if (detail.kind === 'missing') {
    return {
      ...metadata,
      title: `페이지를 찾을 수 없습니다 - ${SITE_NAME}`,
      description: '요청한 포우브릿지 페이지를 찾을 수 없습니다.',
      robots: 'noindex,nofollow',
      knownRoute: false,
    };
  }
  return { ...metadata, ...detail.text };
}

function transformShell(response: Response, pathname: string, search: string, development: boolean, detail: DetailMetadata | null): Response {
  const metadata = withDetail(resolveSeoMetadata(pathname, search), detail);
  const image = detail?.kind === 'found' ? detail.image : undefined;
  const transformed = new HTMLRewriter()
    .on('title', { element(element) { element.setInnerContent(metadata.title); } })
    .on('meta[name="description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('meta[name="robots"]', { element(element) { element.setAttribute('content', (development ? 'noindex, nofollow' : metadata.robots)); } })
    .on('meta[property="og:title"]', { element(element) { element.setAttribute('content', metadata.title); } })
    .on('meta[property="og:description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('meta[property="og:url"]', { element(element) { element.setAttribute('content', metadata.canonicalUrl); } })
    .on('meta[property="og:site_name"]', { element(element) { element.setAttribute('content', SITE_NAME); } })
    .on('meta[name="twitter:title"]', { element(element) { element.setAttribute('content', metadata.title); } })
    .on('meta[name="twitter:description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('link[rel="canonical"]', { element(element) { element.setAttribute('href', metadata.canonicalUrl); } })
    .on('head', {
      element(element) {
        // index.html에는 대표 이미지가 없어서 동물 사진이 있을 때만 붙인다.
        if (image) element.append(`<meta property="og:image" content="${escapeAttribute(image)}" />`, { html: true });
      },
    })
    .transform(response);

  const headers = new Headers(transformed.headers);
  headers.delete('ETag');
  headers.delete('Last-Modified');
  headers.delete('Content-Length');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('X-Robots-Tag', (development ? 'noindex, nofollow' : metadata.robots));

  return new Response(transformed.body, {
    status: metadata.knownRoute ? 200 : 404,
    statusText: metadata.knownRoute ? 'OK' : 'Not Found',
    headers,
  });
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === CSP_REPORT_PATH) {
      return receiveCspReport(request, env.DEPLOYMENT_ENVIRONMENT);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    const shell = await env.ASSETS.fetch(shellRequest(request));
    if (!shell.ok) return shell;

    const development = env.DEPLOYMENT_ENVIRONMENT === 'dev';
    // dev 환경은 운영 API를 부르지 않는다.
    const detail = development ? null : await resolveDetailMetadata(url.pathname);
    const transformed = transformShell(shell, url.pathname, url.search, development, detail);
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: transformed.status,
        statusText: transformed.statusText,
        headers: transformed.headers,
      });
    }
    return transformed;
  },
} satisfies ExportedHandler<Env>;
