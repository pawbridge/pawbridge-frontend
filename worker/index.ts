import { resolveSeoMetadata, SITE_NAME } from '../src/lib/seo';

function shellRequest(request: Request): Request {
  const url = new URL('/', request.url);
  return new Request(url, { method: 'GET' });
}

function transformShell(response: Response, pathname: string, search: string): Response {
  const metadata = resolveSeoMetadata(pathname, search);
  const transformed = new HTMLRewriter()
    .on('title', { element(element) { element.setInnerContent(metadata.title); } })
    .on('meta[name="description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('meta[name="robots"]', { element(element) { element.setAttribute('content', metadata.robots); } })
    .on('meta[property="og:title"]', { element(element) { element.setAttribute('content', metadata.title); } })
    .on('meta[property="og:description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('meta[property="og:url"]', { element(element) { element.setAttribute('content', metadata.canonicalUrl); } })
    .on('meta[property="og:site_name"]', { element(element) { element.setAttribute('content', SITE_NAME); } })
    .on('meta[name="twitter:title"]', { element(element) { element.setAttribute('content', metadata.title); } })
    .on('meta[name="twitter:description"]', { element(element) { element.setAttribute('content', metadata.description); } })
    .on('link[rel="canonical"]', { element(element) { element.setAttribute('href', metadata.canonicalUrl); } })
    .transform(response);

  const headers = new Headers(transformed.headers);
  headers.delete('ETag');
  headers.delete('Last-Modified');
  headers.delete('Content-Length');
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  headers.set('X-Robots-Tag', metadata.robots);

  return new Response(transformed.body, {
    status: metadata.knownRoute ? 200 : 404,
    statusText: metadata.knownRoute ? 'OK' : 'Not Found',
    headers,
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      });
    }

    const url = new URL(request.url);
    const shell = await env.ASSETS.fetch(shellRequest(request));
    if (!shell.ok) return shell;

    const transformed = transformShell(shell, url.pathname, url.search);
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
